import type {
  EmailConfig,
  EmailUserConfig,
  SendVerificationRequestParams,
} from "next-auth/providers/email"
import { createTransport } from "nodemailer9"

async function sendVerificationRequest({
  identifier,
  url,
  provider,
}: SendVerificationRequestParams) {
  const host = new URL(url).host
  const transport = createTransport(
    provider.server as Parameters<typeof createTransport>[0],
  )
  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: `Sign in to ${host}`,
    text: `Sign in to ${host}\n${url}\n\n`,
  })
  const delivery = result as typeof result & { pending?: unknown[]; rejected?: unknown[] }
  const failed = [...(delivery.rejected ?? []), ...(delivery.pending ?? [])].filter(Boolean)

  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`)
  }
}

export function DevelopmentEmailProvider(options: EmailUserConfig): EmailConfig {
  return {
    id: "email",
    type: "email",
    name: "Email",
    server: options.server ?? {
      host: "localhost",
      port: 25,
      auth: { user: "", pass: "" },
    },
    from: options.from ?? "NextAuth <no-reply@example.com>",
    maxAge: options.maxAge ?? 24 * 60 * 60,
    sendVerificationRequest: options.sendVerificationRequest ?? sendVerificationRequest,
    options,
  }
}
