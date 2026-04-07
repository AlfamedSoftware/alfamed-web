import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins"

const authBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3333").replace(/\/$/, "")

export const auth = createAuthClient({
    baseURL: authBaseUrl,
    plugins: [twoFactorClient()],
})