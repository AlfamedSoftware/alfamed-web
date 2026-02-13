import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins"

export const auth = createAuthClient({
    baseURL: "http://localhost:3333",
    plugins: [twoFactorClient()],
})