import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = env.VITE_API_PROXY_TARGET || "https://alfamed-api-dev.vercel.app"

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "spa-fallback",
        configResolved() {},
        apply: "serve",
        middlewares: [
          (req, res, next) => {
            if (req.method === "GET" && !req.url.includes(".") && req.url !== "/") {
              req.url = "/index.html"
            }
            next()
          },
        ],
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
        "/health": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})