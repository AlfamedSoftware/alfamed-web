import { useEffect, useState } from "react"
import { auth } from "@/lib/auth"

export function useSession() {
    const [session, setSession] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data } = await auth.getSession()
                console.log(data)
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
    }
}
