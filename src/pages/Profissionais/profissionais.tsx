import { useState, useMemo } from "react"
import { Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfessionals, type ProfessionalFilter } from "@/hooks/use-professionals"
import type { Professional } from "@/services/professionals.service"

import { ProfessionalCard } from "./components/ProfessionalCard"
import { PageHeader } from "@/components/page-header"
import { ProfessionalFilters } from "./components/ProfessionalFilters"
import { ProfessionalSearch } from "./components/ProfessionalSearch"
import { ProfessionalGridSkeleton } from "./components/ProfessionalSkeleton"
import { ProfessionalEmptyState } from "./components/ProfessionalEmptyState"
import { ToastContainer, useToast } from "./components/Toast"
import { RegisterProfessionalModal } from "./components/RegisterProfessionalModal"

export function Profissionais() {
    const { professionals, isLoading, error, counts, refetch, toggleActive } = useProfessionals()

    const { toasts, dismiss, toast } = useToast()

    const [activeFilter, setActiveFilter] = useState<ProfessionalFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

    const filtered = useMemo(() => {
        let list = professionals

        if (activeFilter === "active") list = list.filter((p) => p.isActive)
        if (activeFilter === "inactive") list = list.filter((p) => !p.isActive)

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(
                (p) =>
                    p.id.toLowerCase().includes(q) ||
                    p.userId.toLowerCase().includes(q) ||
                    (p.name?.toLowerCase().includes(q) ?? false) ||
                    (p.email?.toLowerCase().includes(q) ?? false),
            )
        }

        return list
    }, [professionals, activeFilter, searchQuery])


    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await toggleActive(id, isActive)
            toast.success(isActive ? "Profissional desativado" : "Profissional ativado")
        } catch {
            toast.error("Erro ao alterar status do profissional")
        }
    }

    // editing/removal handled in profile page now via dedicated route

    const isFiltered = activeFilter !== "all" || searchQuery.trim() !== ""

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Profissionais" />

            <div className="px-6 pt-4">
                <p className="text-sm text-muted-foreground mt-0.5">Gerencie a equipe médica do Alfamed</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                <ProfessionalFilters
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    counts={counts}
                />

                <div className="flex-1" />

                <ProfessionalSearch value={searchQuery} onChange={setSearchQuery} />

                <Button
                    id="new-professional-btn"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 gap-1.5 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Profissional
                </Button>
            </div>

            <main className="flex-1 px-6 pb-8">
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <ProfessionalGridSkeleton count={8} />
                ) : filtered.length === 0 ? (
                    <ProfessionalEmptyState isFiltered={isFiltered} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((professional) => (
                            <ProfessionalCard
                                key={professional.id}
                                professional={professional}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                )}
            </main>

            <RegisterProfessionalModal
                open={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onCreated={refetch}
            />

            {/* Edit and remove moved to individual profile page */}

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    )
}
