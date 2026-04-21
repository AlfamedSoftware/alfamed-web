import { useState, useMemo } from "react"
import { Plus, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfessionals, type ProfessionalFilter } from "@/hooks/use-professionals"
import type { Professional } from "@/services/professionals.service"

import { ProfessionalCard } from "./components/ProfessionalCard"
import { ProfessionalFilters } from "./components/ProfessionalFilters"
import { ProfessionalSearch } from "./components/ProfessionalSearch"
import { ProfessionalGridSkeleton } from "./components/ProfessionalSkeleton"
import { ProfessionalEmptyState } from "./components/ProfessionalEmptyState"
import { CreateProfessionalModal } from "./components/CreateProfessionalModal"
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog"
import { ToastContainer, useToast } from "./components/Toast"

export function Profissionais() {
    const {
        professionals,
        isLoading,
        error,
        counts,
        createProfessional,
        updateProfessional,
        removeProfessional,
        toggleActive,
    } = useProfessionals()

    const { toasts, dismiss, toast } = useToast()

    /* ---- UI State ---- */
    const [activeFilter, setActiveFilter] = useState<ProfessionalFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
    const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    /* ---- Filtered + Searched list ---- */
    const filtered = useMemo(() => {
        let list = professionals

        if (activeFilter === "active") list = list.filter((p) => p.isActive)
        if (activeFilter === "inactive") list = list.filter((p) => !p.isActive)

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(
                (p) =>
                    p.id.toLowerCase().includes(q) ||
                    p.userId.toLowerCase().includes(q),
            )
        }

        return list
    }, [professionals, activeFilter, searchQuery])

    /* ---- Handlers ---- */
    const handleOpenCreate = () => {
        setEditingProfessional(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (professional: Professional) => {
        setEditingProfessional(professional)
        setIsModalOpen(true)
    }

    const handleSave = async (data: { userId?: string; isActive: boolean }) => {
        try {
            if (editingProfessional) {
                await updateProfessional(editingProfessional.id, { isActive: data.isActive })
                toast.success("Profissional atualizado com sucesso!")
            } else {
                await createProfessional({ isActive: data.isActive })
                toast.success("Profissional cadastrado com sucesso!")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao salvar profissional")
            throw err // re-throw so modal stays open
        }
    }

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await toggleActive(id, isActive)
            toast.success(isActive ? "Profissional desativado" : "Profissional ativado")
        } catch {
            toast.error("Erro ao alterar status do profissional")
        }
    }

    const handleDeleteRequest = (professional: Professional) => {
        setDeletingProfessional(professional)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingProfessional) return
        setIsDeleting(true)
        try {
            await removeProfessional(deletingProfessional.id)
            toast.success("Profissional removido com sucesso!")
            setDeletingProfessional(null)
        } catch {
            toast.error("Erro ao remover profissional")
        } finally {
            setIsDeleting(false)
        }
    }

    const isFiltered = activeFilter !== "all" || searchQuery.trim() !== ""

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50/60">
            {/* ── Top Header ── */}
            <header className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Profissionais</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gerencie a equipe médica do Alfamed</p>
                </div>
                <button
                    id="notification-bell"
                    className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                </button>
            </header>

            {/* ── Filters + Search + CTA ── */}
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
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 gap-1.5 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Profissional
                </Button>
            </div>

            {/* ── Main Content ── */}
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
                                onEdit={handleOpenEdit}
                                onDelete={handleDeleteRequest}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* ── Modals ── */}
            <CreateProfessionalModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                professional={editingProfessional}
            />

            <DeleteConfirmDialog
                professional={deletingProfessional}
                isOpen={!!deletingProfessional}
                isDeleting={isDeleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeletingProfessional(null)}
            />

            {/* ── Toasts ── */}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    )
}
