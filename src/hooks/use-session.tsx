import { useEffect, useState } from "react"
import { auth } from "@/lib/auth"

type SessionData = Awaited<ReturnType<typeof auth.getSession>>["data"]
type SessionUser = NonNullable<SessionData>["user"]
type SessionInfo = NonNullable<SessionData>["session"]

export function isInternalAlfamedEmail(email?: string | null) {
    return !!email?.toLowerCase().endsWith("@alfamed.com")
}

export function useSession() {
    const [session, setSession] = useState<SessionInfo | null>(null)
    const [user, setUser] = useState<SessionUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data } = await auth.getSession()
                setSession(data?.session || null)
                setUser(data?.user || null)
            } catch (error) {
                console.error("Error fetching session:", error)
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
        isInternalUser: isInternalAlfamedEmail(user?.email),
    }
}
