# Dynamic Certificates Implementation Plan

## Goal
Replace the static mock certificates with dynamic certificates fetched directly from the user profile's `concluded_courses` array via Server Actions.

## Tasks
-[x] Task 1: Update `ICertificate` interface in `src/lib/types/certificate.ts` to reflect the fields from `concluded_courses` (e.g., `date_conclusao`, `credentialId`). → Verify: Typescript compiles without errors.
-[x] Task 2: Refactor `src/app/(app)/dashboard-student/certificates/page.tsx` to call `getProfile()` from `src/app/(app)/dashboard-student/actions.ts` on component mount (`useEffect`). → Verify: `isCheckingAccess` or `isLoading` state is managed while fetching data.
-[x] Task 3: Map the `concluded_courses` array to the certificate cards in the UI, formatting `date_conclusao` to `DD/MM/AAAA`. → Verify: Dynamic data renders correctly in the cards.
-[x] Task 4: Implement the empty state with the message: "Você ainda não possui certificados emitidos. Continue estudando para conquistar sua certificação oficial." → Verify: UI shows this message when `concluded_courses` is empty or undefined.
-[x] Task 5: Bind the "Baixar" and "ExternalLink" buttons to open `CertificateTemplate` passing the correct data for each course. → Verify: Modal opens displaying the correct dynamic data from the selected course.

## Done When
-[x] Certificates page dynamically renders the list of `concluded_courses` from the user's Firestore profile.
-[x] Empty state is properly displayed for users without completed courses.
-[x] PDF Generation and Certificate Preview modal work with the dynamic data.
