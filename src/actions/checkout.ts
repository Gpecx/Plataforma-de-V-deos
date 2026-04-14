"use server";

import { cookies } from "next/headers";
import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AsaasSplit {
  walletId: string;
  percentualValue: number;
}

interface AsaasPaymentPayload {
  customer: string;
  billingType: "PIX";
  value: number;
  dueDate: string;
  description: string;
  split?: AsaasSplit[];
}

interface AsaasPixResponse {
  id: string;
  status: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  invoiceUrl: string;
}

interface AsaasErrorResponse {
  errors: { code: string; description: string }[];
}

interface CourseDoc {
  price: number;
  title: string;
  teacher_id: string;
  teacher_split_percent?: number;
}

interface StudentProfileDoc {
  asaas_customer_id: string;
  email: string;
}

interface TeacherProfileDoc {
  asaas_wallet_id?: string;
}

// ─── Return Type ──────────────────────────────────────────────────────────────

export interface CreatePixChargeResult {
  paymentId: string;
  pixCopyPaste: string;
  pixQrCodeBase64: string;
  expirationDate: string;
  invoiceUrl: string;
  splitApplied: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTomorrowDateStr(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function getAsaasBaseUrl(): string {
  return process.env.ASAAS_API_URL ?? "https://sandbox.asaas.com/api";
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function createPixCharge(
  cursoId: string
): Promise<CreatePixChargeResult> {
  // ── 1. Authenticate via session cookie ──────────────────────────────────────
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    throw new Error("UNAUTHORIZED: No session cookie found.");
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    throw new Error("UNAUTHORIZED: Invalid or expired session.");
  }

  // ── 2a. Fetch Student Profile ────────────────────────────────────────────────
  const studentSnap = await adminDb.collection("profiles").doc(uid).get();
  if (!studentSnap.exists) {
    throw new Error("STUDENT_NOT_FOUND: Student profile does not exist.");
  }
  const studentData = studentSnap.data() as StudentProfileDoc;

  if (!studentData.asaas_customer_id) {
    throw new Error(
      "CUSTOMER_NOT_FOUND: Student does not have a linked Asaas customer ID."
    );
  }

  // ── 2b. Fetch Course Data ────────────────────────────────────────────────────
  const courseSnap = await adminDb.collection("courses").doc(cursoId).get();
  if (!courseSnap.exists) {
    throw new Error(`COURSE_NOT_FOUND: Course ${cursoId} was not found.`);
  }
  const courseData = courseSnap.data() as CourseDoc;

  // ── 2c. Fetch Teacher Wallet (optional, no-throw) ───────────────────────────
  let teacherWalletId: string | null = null;

  if (courseData.teacher_id) {
    const teacherSnap = await adminDb
      .collection("profiles")
      .doc(courseData.teacher_id)
      .get();

    if (teacherSnap.exists) {
      const teacherData = teacherSnap.data() as TeacherProfileDoc;
      if (teacherData.asaas_wallet_id) {
        teacherWalletId = teacherData.asaas_wallet_id;
      } else {
        console.warn(
          `[checkout] Teacher ${courseData.teacher_id} has no asaas_wallet_id. Processing without split.`
        );
      }
    } else {
      console.warn(
        `[checkout] Teacher profile ${courseData.teacher_id} not found. Processing without split.`
      );
    }
  }

  // ── 3. Build Asaas Payload ───────────────────────────────────────────────────
  const splitApplied = teacherWalletId !== null;
  const splitPercentage = courseData.teacher_split_percent || 50;

  const payload: AsaasPaymentPayload = {
    customer: studentData.asaas_customer_id,
    billingType: "PIX",
    value: courseData.price,
    dueDate: getTomorrowDateStr(),
    description: `Acesso ao curso: ${courseData.title}`,
    ...(splitApplied && {
      split: [{ walletId: teacherWalletId!, percentualValue: splitPercentage }],
    }),
  };

  // ── 4. Call Asaas API ────────────────────────────────────────────────────────
  const asaasApiKey = process.env.ASAAS_API_KEY;
  if (!asaasApiKey) {
    throw new Error("CONFIG_ERROR: ASAAS_API_KEY environment variable is not set.");
  }

  const asaasResponse = await fetch(`${getAsaasBaseUrl()}/v3/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: asaasApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!asaasResponse.ok) {
    const errorBody = (await asaasResponse.json()) as AsaasErrorResponse;
    const errorMsg = errorBody.errors?.[0]?.description ?? "Unknown Asaas error";
    throw new Error(`ASAAS_ERROR: ${errorMsg}`);
  }

  const asaasData = (await asaasResponse.json()) as AsaasPixResponse;

  // Fetch PIX QR Code details from Asaas
  const pixResponse = await fetch(
    `${getAsaasBaseUrl()}/v3/payments/${asaasData.id}/pixQrCode`,
    {
      headers: { access_token: asaasApiKey },
    }
  );

  const pixData = pixResponse.ok
    ? ((await pixResponse.json()) as AsaasPixResponse["pixQrCode"])
    : null;

  // ── 5. Audit Log in vendas_logs ──────────────────────────────────────────────
  await adminDb.collection("vendas_logs").add({
    paymentId: asaasData.id,
    userId: uid,
    cursoId,
    status: "PENDING",
    split_applied: splitApplied,
    ...(splitApplied && { 
        teacher_wallet: teacherWalletId,
        split_percentage_applied: splitPercentage
    }),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── 6. Return PIX Data To Frontend ──────────────────────────────────────────
  return {
    paymentId: asaasData.id,
    pixCopyPaste: (pixData as any)?.payload ?? "",
    pixQrCodeBase64: (pixData as any)?.encodedImage ?? "",
    expirationDate: (pixData as any)?.expirationDate ?? "",
    invoiceUrl: asaasData.invoiceUrl,
    splitApplied,
  };
}
