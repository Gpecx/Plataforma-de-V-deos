/**
 * Valida um CPF através do cálculo dos dígitos verificadores (Módulo 11)
 */
export function validateCPF(cpfRaw: string): boolean {
    const cpf = cpfRaw.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

const charToValue = (c: string): number =>
    c >= '0' && c <= '9' ? parseInt(c, 10) : c.charCodeAt(0) - 55

/**
 * Valida um CNPJ através do cálculo dos dígitos verificadores (Módulo 11)
 * Suporta o formato alfanumérico (IN RFB nº 2.229/2024)
 */
export function validateCNPJ(cnpjRaw: string): boolean {
    const cnpj = cnpjRaw.toUpperCase().replace(/[^A-Z0-9]+/g, '');
    if (cnpj.length !== 14 || /^([A-Z0-9])\1{13}$/.test(cnpj)) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += charToValue(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== charToValue(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += charToValue(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== charToValue(digits.charAt(1))) return false;

    return true;
}

/**
 * Interface unificada para validar se um documento (CPF ou CNPJ) é verdadeiro.
 */
export function validateDocument(docStr: string): boolean {
    const cleanDoc = docStr.toUpperCase().replace(/[^A-Z0-9]+/g, '');
    if (cleanDoc.length === 11) return validateCPF(cleanDoc);
    if (cleanDoc.length === 14) return validateCNPJ(cleanDoc);
    return false; // se não for nem 11 nem 14 não é válido nativamente
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function maskCPF(value: string): string {
    const v = value.replace(/\D/g, '').slice(0, 11)
    return v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCNPJ(value: string): string {
    const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14)
    return v
        .replace(/^([A-Z0-9]{2})([A-Z0-9])/, '$1.$2')
        .replace(/^([A-Z0-9]{2}\.)([A-Z0-9]{3})([A-Z0-9])/, '$1$2.$3')
        .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, '.$1/$2')
        .replace(/([A-Z0-9]{4})([A-Z0-9]{1,2})/, '$1-$2')
        .replace(/(-\d{2})[A-Z0-9]+?$/, '$1')
}

/**
 * Aplica máscara de RG: 00.000.000-0
 */
export function maskRG(value: string): string {
    const v = value.replace(/\D/g, '').slice(0, 9)
    return v
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,1})/, '$1-$2')
}

/**
 * Aplica máscara dinâmica de CPF ou CNPJ baseado no length sendo digitado
 */
export function maskCpfCnpj(value: string): string {
    const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (v.length <= 11) {
        return maskCPF(value)
    } else {
        return maskCNPJ(value)
    }
}

