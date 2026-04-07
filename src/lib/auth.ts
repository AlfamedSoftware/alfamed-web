import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins"

export const authBaseUrl = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "")

export const auth = createAuthClient({
    baseURL: authBaseUrl,
    plugins: [twoFactorClient()],
})