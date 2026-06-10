"use server";

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherOnboardingParams {
  teacherUid: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string;
}

interface AsaasAccountPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string;
  companyType?: string;
  incomeValue?: number;
}

interface AsaasAccountResponse {
  object: string;
  hasError?: string;
  id: string;
  walletId: string;
  apiKey: string;
}

interface AsaasErrorResponse {
  errors: { code: string; description: string }[];
}

export interface CreateTeacherWalletResult {
  success: boolean;
  walletId?: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAsaasBaseUrl(): string {
  return process.env.ASAAS_API_URL ?? "https://sandbox.asaas.com/api";
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function createTeacherWallet(
  params: TeacherOnboardingParams
): Promise<CreateTeacherWalletResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return { success: false, error: "UNAUTHORIZED: Você não está logado." };
  }

  let adminUid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    adminUid = decoded.uid;
  } catch {
    return { success: false, error: "UNAUTHORIZED: Sessão inválida ou expirada." };
  }

  const adminUserSnap = await adminDb.collection("users").doc(adminUid).get();
  if (!adminUserSnap.exists) {
    return { success: false, error: "FORBIDDEN: Perfil de usuário não encontrado." };
  }

  const adminData = adminUserSnap.data();

  if (adminData?.ativo === false) {
    return { success: false, error: "FORBIDDEN: Sua conta administrativa está inativa ou suspensa." };
  }

  const isSuperAdminEmail = adminData?.email === "frederico.motta@gpecx.com.br";
  const hasAdminRole = adminData?.role === "admin" || adminData?.role === "Administrador";

  if (!isSuperAdminEmail && !hasAdminRole) {
    return { success: false, error: "FORBIDDEN: Apenas administradores podem criar contas Asaas." };
  }

  const asaasApiKey = process.env.ASAAS_API_KEY;
  if (!asaasApiKey) {
    console.error("[TeacherOnboarding] Missing ASAAS_API_KEY");
    return { success: false, error: "Erro de configuração do servidor (Asaas)." };
  }

  const payload: AsaasAccountPayload = {
    name: params.name,
    email: params.email,
    cpfCnpj: params.cpfCnpj.replace(/\D/g, ""),
    mobilePhone: params.mobilePhone.replace(/\D/g, ""),
  };

  try {
    const response = await fetch(`${getAsaasBaseUrl()}/v3/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = (await response.json()) as AsaasErrorResponse;
      const errorMsg = errorBody.errors?.[0]?.description ?? "Erro desconhecido no Asaas";
      return { success: false, error: errorMsg };
    }

    const data = (await response.json()) as AsaasAccountResponse;

    if (!data.walletId) {
      return { success: false, error: "Asaas não retornou um walletId válido." };
    }

    await adminDb.collection("profiles").doc(params.teacherUid).set(
      { asaas_wallet_id: data.walletId },
      { merge: true }
    );

    return { success: true, walletId: data.walletId };

  } catch (error: any) {
    console.error("[TeacherOnboarding] Fatal Error:", error);
    return { success: false, error: "Erro de comunicação com o Asaas ou Firestore." };
  }
}
