import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, X } from "lucide-react"
import { professionalUnitSpecialtiesService, type ProfessionalUnitSpecialty } from "@/Servicos/professional-unit-specialties.service"
import { specialtiesService, type SpecialtyUnitFullData } from "@/Servicos/specialties.service"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { ProfissionaisEspecialidadesSkeleton } from "./Componentes/Skeleton/profissionais-especialidades-skeleton"

export function ProfissionaisEspecialidades() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { sessionUnit } = useSessionUnit()

    const professionalUnitId = searchParams.get("professionalUnitId")
    const selectedUnitId = sessionUnit?.selectedUnitId ?? null

    const [specialties, setSpecialties] = useState<ProfessionalUnitSpecialty[]>([])
    const [allSpecialties, setAllSpecialties] = useState<SpecialtyUnitFullData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("")

    useEffect(() => {
        const fetchData = async () => {
            if (!professionalUnitId || !selectedUnitId) {
                navigate("/especialidades/vinculo-listagem-profissionais")
                return
            }

            setIsLoading(true)
            try {
                const [linkedSpecialties, allSpecialtiesData] = await Promise.all([
                    professionalUnitSpecialtiesService.listByProfessionalUnit(professionalUnitId),
                    specialtiesService.listByUnit(selectedUnitId),
                ])

                setSpecialties(linkedSpecialties)
                setAllSpecialties(allSpecialtiesData)
            } catch (error) {
                alert(error instanceof Error ? error.message : "Erro ao carregar especialidades")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [professionalUnitId, selectedUnitId, navigate])

    const handleAddSpecialty = async () => {
        if (!selectedSpecialtyId || !professionalUnitId) return

        setIsAdding(true)
        try {
            await professionalUnitSpecialtiesService.create({
                professionalUnitId,
                specialtyId: selectedSpecialtyId,
            })

            const linkedSpecialties = await professionalUnitSpecialtiesService.listByProfessionalUnit(professionalUnitId)
            setSpecialties(linkedSpecialties)
            setSelectedSpecialtyId("")

            alert("Especialidade vinculada com sucesso")
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao vincular especialidade")
        } finally {
            setIsAdding(false)
        }
    }

    const handleRemoveSpecialty = async (specialty: ProfessionalUnitSpecialty) => {
        setRemovingId(specialty.id)
        try {
            await professionalUnitSpecialtiesService.update({
                id: specialty.id,
                isActive: false,
            })

            setSpecialties(specialties.filter(s => s.id !== specialty.id))

            alert("Especialidade removida com sucesso")
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao remover especialidade")
        } finally {
            setRemovingId(null)
        }
    }

    const availableSpecialties = allSpecialties.filter(s => {
        if (!s.isActive) return false
        const linkedSpecialty = specialties.find(ls => ls.specialtyId === s.id)
        return !linkedSpecialty || !linkedSpecialty.isActive
    })
    const activeSpecialties = specialties.filter(s => s.isActive)

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Vínculo de Especialidades" />

            <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
                {isLoading ? (
                    <ProfissionaisEspecialidadesSkeleton />
                ) : (
                    <div className="grid gap-5">
                        <div className="grid gap-5">
                            <label className="grid gap-2">
                                <span className="text-sm font-medium">Adicionar Especialidade</span>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedSpecialtyId}
                                        onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                                        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Selecione uma especialidade</option>
                                        {availableSpecialties.map((specialty) => (
                                            <option key={specialty.id} value={specialty.id}>
                                                {specialty.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button onClick={handleAddSpecialty} disabled={!selectedSpecialtyId || isAdding} className="cursor-pointer">
                                        {isAdding ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        Adicionar
                                    </Button>
                                </div>
                            </label>

                            {activeSpecialties.length > 0 && (
                                <div className="grid gap-2">
                                    <p className="text-sm font-semibold text-foreground">
                                        Especialidades Vinculadas ({activeSpecialties.length})
                                    </p>
                                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                        <div className="space-y-3">
                                            {activeSpecialties.map((specialty) => (
                                                <div
                                                    key={specialty.id}
                                                    className="flex items-center justify-between gap-4 py-2"
                                                >
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">
                                                            {specialty.specialty.name}
                                                            {!specialty.specialty.isActive && (
                                                                <span className="ml-2 text-sm font-medium text-destructive">(Inativo)</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Vinculada em {new Date(specialty.createdAt).toLocaleDateString("pt-BR")}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRemoveSpecialty(specialty)}
                                                        disabled={removingId !== null}
                                                        className="cursor-pointer"
                                                    >
                                                        {removingId === specialty.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                        ) : (
                                                            <X className="h-4 w-4 mr-1" />
                                                        )}
                                                        {removingId === specialty.id ? "Removendo..." : "Remover"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {specialties.length === 0 && (
                                <div className="rounded-2xl border border-border bg-muted/30 px-5 py-8">
                                    <div className="text-center text-muted-foreground">
                                        <p className="text-sm font-medium mb-1">Nenhuma especialidade vinculada</p>
                                        <p className="text-xs">Adicione especialidades ao profissional usando o formulário acima.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/especialidades/vinculo-listagem-profissionais")}
                                    className="cursor-pointer"
                                >
                                    Voltar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}