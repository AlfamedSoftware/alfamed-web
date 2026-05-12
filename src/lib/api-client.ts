// Global navigation callback to handle redirects from API calls
let navigationCallback: ((path: string) => void) | null = null

export function setNavigationCallback(callback: (path: string) => void) {
    navigationCallback = callback
}

export async function fetchWithAuth<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
    })

    // Intercepta 401 (Unauthorized)
    if (response.status === 401) {
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
