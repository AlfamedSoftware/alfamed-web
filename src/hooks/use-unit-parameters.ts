import { useEffect, useState } from "react"
import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"

interface UnitParameters {
    modulo1GestaoExames: boolean
}

export function useUnitParameters(unitId: string | null) {
    const [params, setParams] = useState<UnitParameters | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!unitId) return
        let cancelled = false
        setIsLoading(true)
        fetchWithAuth<UnitParameters>(`${authBaseUrl}/unit-parameters/get-parameters/${unitId}`)
            .then((data) => { if (!cancelled) setParams(data) })
            .catch(() => { if (!cancelled) setParams(null) })
            .finally(() => { if (!cancelled) setIsLoading(false) })
        return () => { cancelled = true }
    }, [unitId])

    return {
        isLoading,
        modulo1GestaoExames: params?.modulo1GestaoExames ?? false,
    }
}
