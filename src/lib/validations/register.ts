import { z } from "zod";
import { validateCPF, validateCNPJ } from "@/lib/document-utils";

// Step 1: Access
export const Step1Schema = z.object({
    fullName: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone inválido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
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
    birthDate: z.string().optional().refine((val) => {
        if (!val) return true
        const [day, month, year] = val.split('/')
        const birth = new Date(Number(year), Number(month) - 1, Number(day))
        const today = new Date()
        const age = today.getFullYear() - birth.getFullYear() -
            (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
        return age >= 18
    }, { message: 'É necessário ter pelo menos 18 anos para se cadastrar.' }),
    razaoSocial: z.string().optional(),
    rg: z.string().optional(),
}).refine((data) => {
    if (data.personType === "CPF") {
        const digits = (data.rg || '').replace(/\D/g, '')
        if (digits.length > 0 && digits.length < 7) return false
    }
    return true
}, {
    message: "RG deve ter pelo menos 7 dígitos",
    path: ["rg"],
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
    logradouro: z.string().min(3, "Logradouro é obrigatório"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z.string().length(2, "UF deve ter 2 caracteres"),
    termsAccepted: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

export const RegisterSchema = Step1Schema.and(Step2Schema).and(Step3Schema);

export type RegisterInput = z.infer<typeof RegisterSchema>;
