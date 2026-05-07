import "dotenv/config"
import { chromium, type Page } from "@playwright/test"
import { spawn, type ChildProcess } from "node:child_process"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import type { Readable } from "node:stream"

type ScreenshotServer = ChildProcess & { stdout: Readable }

const port = process.env.SCREENSHOT_PORT ?? "3010"
const baseUrl = `http://localhost:${port}`
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR ?? path.join("public-readme", "screenshots")
const screenshotDatabaseUrl = process.env.SCREENSHOT_DATABASE_URL ?? "file:./screenshots.db"
const loginEmail = process.env.SCREENSHOT_LOGIN_EMAIL ?? "sally.ride@example.com"

async function waitForServer(url: string, timeoutMs = 60_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.status < 500) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function startServer(): ScreenshotServer {
  const nextCli = path.resolve("node_modules", "next", "dist", "bin", "next")
  const env = {
    ...process.env,
    DATABASE_URL: screenshotDatabaseUrl,
    EMAIL_DEV_PRINT_TOKEN: "true",
    PORT: port,
    NEXTAUTH_URL: baseUrl,
  }

  const server = spawn(process.execPath, [nextCli, "dev", "-p", port], {
    stdio: ["ignore", "pipe", "inherit"],
    env,
  })

  if (!server.stdout) {
    throw new Error("Screenshot server stdout was not available.")
  }

  server.stdout.setEncoding("utf8")
  server.stdout.on("data", (chunk) => process.stdout.write(chunk))

  return server as ScreenshotServer
}

function waitForMagicLink(server: ScreenshotServer): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error("Timed out waiting for the dev magic-link URL."))
    }, 30_000)

    const onData = (chunk: Buffer | string) => {
      const match = String(chunk).match(/Verification URL:\s*(https?:\/\/\S+)/)
      if (!match?.[1]) return

      cleanup()
      resolve(match[1])
    }

    const cleanup = () => {
      clearTimeout(timeout)
      server.stdout.off("data", onData)
    }

    server.stdout.on("data", onData)
  })
}

async function loginWithMagicLink(page: Page, server: ScreenshotServer) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Server Konsole" }).click()
  await page.getByPlaceholder("max.mustermann@example.com").fill(loginEmail)

  const magicLink = waitForMagicLink(server)
  await page.getByRole("button", { name: "Magic Link senden" }).click()
  await page.goto(await magicLink, { waitUntil: "networkidle" })
}

async function capturePage(page: Page, route: string, fileName: string) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" })
  await page.screenshot({ path: path.join(outputDir, fileName) })
}

const server = startServer()

try {
  await waitForServer(baseUrl)
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  })

  const page = await context.newPage()
  await loginWithMagicLink(page, server)
  await capturePage(page, "/buy", "buy.png")
  await capturePage(page, "/grouporders", "grouporders.png")
  await capturePage(page, "/account", "account.png")

  await browser.close()
  console.log(`Screenshots written to ${outputDir}`)
} finally {
  server.kill()
}
