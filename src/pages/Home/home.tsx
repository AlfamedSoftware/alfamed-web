import { PageHeader } from "@/components/page-header"
import { useSession } from "@/hooks/use-session"
import { authBaseUrl } from "@/lib/auth"
import { useEffect, useState } from "react"

interface SessionClinicsResponse {
    clinics: Array<{ id: string; name: string }>
    selectedClinicId?: string
}

export function Home() {
    const { session } = useSession()
    const [selectedUnitName, setSelectedUnitName] = useState<string | null>(null)
    const displayedUnitName = session ? selectedUnitName : null

    useEffect(() => {
        if (!session) return

        const controller = new AbortController()

        const loadSelectedClinic = async () => {
            try {
                const response = await fetch(`${authBaseUrl}/session/clinics`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    signal: controller.signal,
                })

                if (!response.ok) {
                    setSelectedUnitName(null)
                    return
                }

                const data = (await response.json()) as SessionClinicsResponse
                const selectedClinic = data.clinics.find((clinic) => clinic.id === data.selectedClinicId)
                setSelectedUnitName(selectedClinic?.name ?? null)
            } catch {
                if (!controller.signal.aborted) {
                    setSelectedUnitName(null)
                }
            }
        }

        void loadSelectedClinic()

        return () => controller.abort()
    }, [session])

    return (
        <>
            <PageHeader title="Dashboard" />
            <div className="flex flex-1 flex-col p-4">
                {displayedUnitName && (
                    <p className="mb-2 text-sm text-muted-foreground">
                        Unidade ativa: <span className="font-medium text-foreground">{displayedUnitName}</span>
                    </p>
                )}
                <p className="text-muted-foreground">Conteúdo de Dashboard em breve.</p>
            </div>
        </>
    )
}
