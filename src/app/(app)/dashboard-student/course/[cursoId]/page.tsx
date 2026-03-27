import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import SecureMuxPlayer from "@/components/SecureMuxPlayer";

interface CoursePageProps {
  params: { cursoId: string };
}

interface CourseData {
  title: string;
  description: string;
  playbackId: string;
}

interface ProfileData {
  cursos_comprados?: string[];
  active_session_id?: string;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { cursoId } = params;

  // ─── 1. Auth: Verify session cookie ──────────────────────────────────────
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let uid: string;

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decodedToken.uid;
  } catch {
    // Token invalid or expired — clear cookies and redirect
    redirect("/api/auth/signout?redirectTo=/login" as any);
  }

  // ─── 2. Session Lock: Validate active_session_id ─────────────────────────
  const sessionIdCookie = cookieStore.get("active_session_id")?.value;

  if (!sessionIdCookie) {
    redirect("/api/auth/signout?redirectTo=/login" as any);
  }

  // ─── 3. Enrollment validation: Check purchase + session concurrency ───────
  const profileSnap = await adminDb.collection("profiles").doc(uid).get();

  if (!profileSnap.exists) {
    redirect("/dashboard-student/my-courses?error=unauthorized" as any);
  }

  const profileData = profileSnap.data() as ProfileData;

  // Session Lock check: compare cookie UUID against Firestore record
  if (profileData.active_session_id !== sessionIdCookie) {
    // Another device logged in and took over the session
    redirect(
      "/api/auth/signout?redirectTo=/login?error=concurrent_login" as any
    );
  }

  const cursosPurchased = profileData?.cursos_comprados ?? [];

  if (!cursosPurchased.includes(cursoId)) {
    redirect("/dashboard-student/my-courses?error=unauthorized" as any);
  }

  // ─── 4. Fetch course data ─────────────────────────────────────────────────
  const courseSnap = await adminDb.collection("courses").doc(cursoId).get();

  if (!courseSnap.exists) {
    redirect("/dashboard-student/my-courses" as any);
  }

  const courseData = courseSnap.data() as CourseData;

  // ─── 5. Render ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {/* Player */}
        <SecureMuxPlayer
          cursoId={cursoId}
          playbackId={courseData.playbackId}
        />

        {/* Course Metadata */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{courseData.title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {courseData.description}
          </p>
        </div>
      </div>
    </main>
  );
}
