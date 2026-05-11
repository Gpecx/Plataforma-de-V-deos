import { z } from "zod";
import { validateCPF, validateCNPJ } from "@/lib/document-utils";

// Step 1: Access
export const Step1Schema = z.object({
    fullName: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
    username: z.string().min(3, "ID de usuário inválido").optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

// Step 2: Identification
export const Step2Schema = z.object({
    personType: z.enum(["CPF", "CNPJ"]),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    birthDate: z.string().optional(),
    razaoSocial: z.string().optional(),
}).refine((data) => {
    if (data.personType === "CPF") {
        return !!data.cpf && validateCPF(data.cpf);
    }
    return true;
}, {
    message: "CPF inválido",
    path: ["cpf"],
}).refine((data) => {
    if (data.personType === "CNPJ") {
        return !!data.cnpj && validateCNPJ(data.cnpj);
    }
    return true;
}, {
    message: "CNPJ inválido",
    path: ["cnpj"],
});

// Step 3: Address
export const Step3Schema = z.object({
    cep: z.string().length(9, "CEP inválido"),
    rua: z.string().min(3, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z.string().length(2, "UF deve ter 2 caracteres"),
    termsAccepted: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

export const RegisterSchema = Step1Schema.and(Step2Schema).and(Step3Schema);

export type RegisterInput = z.infer<typeof RegisterSchema>;
