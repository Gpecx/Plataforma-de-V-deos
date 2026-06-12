export function generateResetPasswordEmailHTML(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha - PowerPlay</title>
</head>
<body style="margin:0;padding:0;background-color:#061629;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#061629;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#161B22;border-radius:12px;border:1px solid #1D5F31;border-top:3px solid #1D5F31;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:20px;padding-right:8px;color:#FFFFFF;">▶</td>
                  <td style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">POWERPLAY</td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:13px;color:#8B949E;letter-spacing:0.5px;">Redefinição de Senha</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1D5F31;opacity:0.2;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#E6EDF3;line-height:1.6;">
                Recebemos uma solicitação de redefinição de senha para sua conta. Clique no botão abaixo para criar uma nova senha:
              </p>

              <!-- Reset Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display:inline-block;background-color:#1D5F31;color:#FFFFFF;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#8B949E;line-height:1.5;">
                Este link expira em <strong style="color:#E6EDF3;">1 hora</strong>.
              </p>
              <p style="margin:0;font-size:12px;color:#6E7681;line-height:1.5;">
                Se você não solicitou esta redefinição, ignore este e-mail.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="height:1px;background-color:#1D5F31;opacity:0.2;margin-bottom:20px;"></div>
              <p style="margin:0;font-size:11px;color:#6E7681;text-align:center;">
                © 2026 POWERPLAY – VoltsMind Holding. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateVerificationEmailHTML(code: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu código PowerPlay</title>
</head>
<body style="margin:0;padding:0;background-color:#0D1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D1117;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#161B22;border-radius:12px;border:1px solid #21262D;border-top:3px solid #22c55e;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:22px;padding-right:8px;">⚡</td>
                  <td style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">POWERPLAY</td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:13px;color:#8B949E;letter-spacing:0.5px;">Verificação de Identidade</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#21262D;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#E6EDF3;line-height:1.6;">
                Use o código abaixo para confirmar seu login:
              </p>

              <!-- Code Box -->
              <div style="background-color:#0D2818;border:1px solid #22c55e;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;color:#22c55e;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">
                  ${code}
                </span>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#8B949E;line-height:1.5;">
                Este código expira em <strong style="color:#E6EDF3;">5 minutos</strong>.
              </p>
              <p style="margin:0;font-size:12px;color:#6E7681;line-height:1.5;">
                Se você não solicitou este código, ignore este e-mail.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="height:1px;background-color:#22c55e;opacity:0.2;margin-bottom:20px;"></div>
              <p style="margin:0;font-size:11px;color:#6E7681;text-align:center;">
                © 2026 POWERPLAY – VoltsMind Holding. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
