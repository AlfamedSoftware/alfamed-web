import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins"

const defaultAuthBaseUrl =
    typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
        ? "http://localhost:3333"
        : "https://alfamed-api-dev.vercel.app"

export const authBaseUrl = (import.meta.env.VITE_API_URL ?? defaultAuthBaseUrl).trim().replace(/\/+$/, "")

export const auth = createAuthClient({
    baseURL: authBaseUrl,
    plugins: [twoFactorClient()],
})