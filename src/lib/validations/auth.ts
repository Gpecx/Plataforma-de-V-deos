import { z } from "zod";

/**
 * Zod Schema for Password Change validation.
 * Ensures complexity and matching confirmation.
 */
export const PasswordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z
            .string()
            .min(8, "A nova senha deve ter pelo menos 8 caracteres")
            .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
            .regex(/[0-9]/, "Deve conter ao menos um número"),
        confirmPassword: z.string().min(1, "Confirme sua nova senha"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    });

export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;
