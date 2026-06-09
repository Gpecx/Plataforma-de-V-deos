// LGPD: Utilitário de logging que redige campos pessoais sensíveis antes de
// qualquer saída para console/logs de servidor. Nunca logar dados brutos de
// usuário — usar sempre logError/logInfo em vez de console.error/console.log.

const SENSITIVE_KEYS = [
  'cpf_cnpj',
  'rg',
  'phone',
  'birth_date',
  'cep',
  'logradouro',   // campo atual (rua foi migrado para logradouro)
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'asaas_customer_id',
  'password',
  'ip_address',
  'email',
  'full_name',
  'pix_key',
  'bank_agency',
  'bank_account',
]

function sanitize(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value
  if (Array.isArray(value)) return value.map(sanitize)
  const obj = value as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE_KEYS.includes(k) ? [k, '[REDACTED]'] : [k, sanitize(v)]
    )
  )
}

export function logError(context: string, error: unknown): void {
  console.error(`[ERROR] ${context}`, sanitize(error))
}