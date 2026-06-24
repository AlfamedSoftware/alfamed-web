let navigationCallback: ((path: string) => void) | null = null
let isRedirectingToLogin = false

export function setNavigationCallback(callback: (path: string) => void) {
    navigationCallback = callback
}

export async function fetchWithAuth<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const method = (options?.method ?? "GET").toUpperCase()
    const hasBody = options?.body !== undefined && options?.body !== null
    const shouldSendJsonContentType = hasBody && method !== "GET" && method !== "HEAD"

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            ...(options?.headers ?? {}),
            ...(shouldSendJsonContentType ? { "Content-Type": "application/json" } : {}),
        },
    })

    if (response.status === 401) {
        if (!isRedirectingToLogin) {
            isRedirectingToLogin = true
            if (navigationCallback) {
                navigationCallback("/login?motivo=sessao-expirada")
            }
        }
        throw new Error("Sessão expirada. Redirecionando para login.")
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Erro desconhecido" }))
        throw new Error(error?.message ?? `Erro ${response.status}`)
    }

    // 204 No Content or empty body
    const text = await response.text()
    if (!text) return undefined as T

    return JSON.parse(text) as T
}
