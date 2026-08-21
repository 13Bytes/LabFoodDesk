import { describe, expect, it } from "vitest"
import { DevelopmentEmailProvider } from "./developmentEmailProvider"

describe("DevelopmentEmailProvider", () => {
  it("sends a verification email with Nodemailer 9", async () => {
    const provider = DevelopmentEmailProvider({
      from: "LabFoodDesk <test@example.com>",
      server: { jsonTransport: true },
    })

    await expect(
      provider.sendVerificationRequest({
        identifier: "user@example.com",
        url: "https://example.com/api/auth/callback/email?token=test",
        expires: new Date("2030-01-01T00:00:00Z"),
        provider,
        token: "test",
        theme: {
          brandColor: "#000000",
          buttonText: "#ffffff",
          colorScheme: "auto",
        },
      }),
    ).resolves.toBeUndefined()
  })
})
