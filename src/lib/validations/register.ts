import { z } from "zod";
import { validateCPF, validateCNPJ } from "@/lib/document-utils";

export const RegisterSchema = z.object({
    // Step 1: Access
    fullName: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),

    // Step 2: Identification
    personType: z.enum(["CPF", "CNPJ"]),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    birthDate: z.string().optional(),
    razaoSocial: z.string().optional(),

    // Step 3: Address
    cep: z.string().length(9, "CEP inválido"),
    rua: z.string().min(3, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z.string().length(2, "UF deve ter 2 caracteres"),
    
    termsAccepted: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.personType === "CPF") {
        return !!data.cpf && validateCPF(data.cpf);
    }
    return !!data.cnpj && validateCNPJ(data.cnpj);
}, {
    message: "Documento inválido",
    path: ["cpf", "cnpj"],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
