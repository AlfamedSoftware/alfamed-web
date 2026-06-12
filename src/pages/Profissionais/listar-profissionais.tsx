import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfessionalCard } from "./Componentes/listar-profissionais-card"
import { PageHeader } from "@/components/page-header"
import { ProfessionalFilters } from "./Componentes/ProfessionalFilters"
import { ProfessionalSearch } from "./Componentes/ProfessionalSearch"
import { ProfessionalGridSkeleton } from "./Componentes/Skeleton/listar-profissionais-skeleton"
import { ProfessionalEmptyState } from "./Componentes/ProfessionalEmptyState"
import { professionalsService, type ProfessionalUnitFullData } from "@/Servicos/professionals.service"
import { useSessionUnit } from "@/contexts/session-unit-context"

type ProfessionalFilter = "all" | "active" | "inactive"

interface ProfissionaisProps {
    isAgenda?: boolean
}

export function Profissionais({ isAgenda = false }: ProfissionaisProps) {
    const navigate = useNavigate()
    const { sessionUnit } = useSessionUnit()
    const selectedUnitId = sessionUnit?.selectedUnitId ?? null

    const [professionals, setProfessionals] = useState<ProfessionalUnitFullData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfessionals = async () => {
            if (!selectedUnitId) {
                setProfessionals([])
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)
            try {
                const data = await professionalsService.listByUnit(
                    selectedUnitId,
                    isAgenda ? { isActive: true, roleKey: "medic" } : { isActive: undefined, roleKey: undefined },
                )
                setProfessionals(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar profissionais")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfessionals()
    }, [selectedUnitId, isAgenda])

    const counts = useMemo(
        () => ({
            all: professionals.length,
            active: professionals.filter((p) => p.isActive).length,
            inactive: professionals.filter((p) => !p.isActive).length,
        }),
        [professionals],
    )

    const [activeFilter, setActiveFilter] = useState<ProfessionalFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")

    const filtered = useMemo(() => {
        let list = professionals

        if (activeFilter === "active") list = list.filter((p) => p.isActive)
        if (activeFilter === "inactive") list = list.filter((p) => !p.isActive)

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter((p) => {
                const users = p.users
                const firstUser = Array.isArray(users) ? users[0] : users
                return (
                    (firstUser?.name?.toLowerCase().includes(q) ?? false) ||
                    (firstUser?.cpf?.toLowerCase().includes(q) ?? false)
                )
            })
        }

        return list
    }, [professionals, activeFilter, searchQuery])

    const isFiltered = activeFilter !== "all" || searchQuery.trim() !== ""
    const handleProfessionalClick = isAgenda
        ? (professionalId: string) => navigate(`/profissionais/${professionalId}?isAgenda=true`)
        : undefined

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title={isAgenda ? "Profissionais - Cadastro de Agendas" : "Profissionais"} />

            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                <ProfessionalFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />

                <div className="flex-1" />

                <ProfessionalSearch value={searchQuery} onChange={setSearchQuery} />

                {!isAgenda && (
                    <Button
                        id="new-professional-btn"
                        onClick={() => navigate("/profissionais/novo")}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 gap-1.5 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Profissional
                    </Button>
                )}
            </div>

            <main className="flex-1 px-6 pb-8">
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
                )}

                {isLoading ? (
                    <ProfessionalGridSkeleton count={24} />
                ) : filtered.length === 0 ? (
                    <ProfessionalEmptyState isFiltered={isFiltered} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((professional) => (
                            <ProfessionalCard key={professional.id} professional={professional} onClick={handleProfessionalClick} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
