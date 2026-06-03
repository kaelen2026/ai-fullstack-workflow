import type { Bindings } from '../bindings'

/**
 * Transactional email via Resend's REST API.
 *
 * Called with fetch (no SDK) so it runs cleanly on Workers. In dev, when
 * `RESEND_API_KEY` is unset, the message is logged to the console instead of
 * sent — so the password-reset flow is fully testable without a Resend account.
 */
type SendArgs = { to: string; subject: string; html: string }

export async function sendEmail(env: Bindings, { to, subject, html }: SendArgs) {
  if (!env.RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY unset — not sending "${subject}" to ${to}.`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || 'Todos <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`)
  }
}

const FONT =
  "-apple-system,'SF Pro Text',BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

/** On-brand (DESIGN.md) password-reset email. `url` is better-auth's reset link. */
export function resetPasswordEmail(url: string): Omit<SendArgs, 'to'> {
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f5f7;padding:40px 16px;font-family:${FONT};color:#1d1d1f;line-height:1.5;-webkit-font-smoothing:antialiased">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:420px;background:#ffffff;border:1px solid #d2d2d7;border-radius:14px;padding:32px" cellpadding="0" cellspacing="0">
          <tr><td>
            <h1 style="margin:0 0 8px;font-size:21px;font-weight:600;letter-spacing:-0.02em">Reset your password</h1>
            <p style="margin:0 0 24px;color:#6e6e73;font-size:15px">
              We received a request to reset your Todos password. Click below to choose a new one. This link expires in 1 hour.
            </p>
            <a href="${url}" style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:11px 20px;border-radius:980px">Reset password</a>
            <p style="margin:24px 0 0;color:#6e6e73;font-size:13px">
              If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;color:#6e6e73;font-size:12px">Todos</p>
      </td></tr>
    </table>
  </body>
</html>`

  return { subject: 'Reset your Todos password', html }
}
