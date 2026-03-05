/**
 * Safely converts a Firebase Timestamp, ISO string, or Date object into a standard JS Date.
 * Use this whenever you are reading dates from Firestore to avoid 'Invalid time value' errors.
 */
export function parseFirebaseDate(dateValue: any): Date | null {
    if (!dateValue) return null;

    // Se já é um objeto Date válido
    if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    // Se é um objeto Timestamp do Firebase (tem o método toDate)
    if (typeof dateValue.toDate === 'function') {
        try {
            return dateValue.toDate();
        } catch (e) {
            return null;
        }
    }

    // Se é uma string ISO ou timestamp numérico
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Estrutura Timestamp raw {_seconds, _nanoseconds} caso venha serializado
    if (dateValue && typeof dateValue === 'object' && ('seconds' in dateValue || '_seconds' in dateValue)) {
        const seconds = dateValue.seconds || dateValue._seconds;
        if (typeof seconds === 'number') {
            return new Date(seconds * 1000);
        }
    }

    return null;
}

/**
 * Safely formats a Firebase date into a locale string (pt-BR).
 */
export function formatDateBR(dateValue: any, options?: Intl.DateTimeFormatOptions): string {
    const date = parseFirebaseDate(dateValue);
    if (!date) return '---';

    const defaultOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('pt-BR', options || defaultOptions).format(date);
}

/**
 * Safely formats a Firebase date into a short date string (DD/MM/YYYY).
 */
export function formatShortDateBR(dateValue: any): string {
    const date = parseFirebaseDate(dateValue);
    if (!date) return '---';
    return date.toLocaleDateString('pt-BR');
}
