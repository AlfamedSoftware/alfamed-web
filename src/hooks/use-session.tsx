import { useEffect, useState } from "react"
import { auth } from "@/lib/auth"

export function useSession() {
    const [session, setSession] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSession = async () => {
            try {
                console.log("🔄 Buscando sessão...")
                const { data } = await auth.getSession()
                console.log("📢 Resposta completa de getSession():", { data })
                console.log("📢 session:", data?.session)
                console.log("📢 user:", data?.user)
                setSession(data?.session || null)
                setUser(data?.user || null)
            } catch (error) {
                console.error("❌ Erro ao buscar sessão:", error)
                setSession(null)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSession()
    }, [])

    return {
        session,
        user,
        isLoading,
    }
}
