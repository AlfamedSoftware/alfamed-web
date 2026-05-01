import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Professional } from "@/services/professionals.service"

interface ModalProfessionalDetailsProps {
    open: boolean
    professional: Professional | null
    onClose: () => void
    onEdit: (professionalId: string) => void
}

function getInitials(name?: string) {
    const value = name?.trim()
    if (!value) return "PR"
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function ModalProfessionalDetails({ open, professional, onClose, onEdit }: ModalProfessionalDetailsProps) {
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    if (!open || !professional) return null

    const initials = getInitials(professional.name)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-xl p-6 bg-card text-card-foreground border border-border animate-in fade-in-0 zoom-in-95">
                <button
                    aria-label="Fechar"
                    className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center gap-3 mb-4">
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg", "bg-blue-500")}>{initials}</div>
                    <div className="text-center">
                        <h3 className="text-base font-semibold">{professional.name ?? "Profissional"}</h3>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                            style={{ background: professional.isActive ? "#ECFDF5" : "#F3F4F6" }}>
                            <span className={professional.isActive ? "w-2.5 h-2.5 rounded-full bg-green-500" : "w-2.5 h-2.5 rounded-full bg-gray-400"} />
                            <span className={professional.isActive ? "text-green-700" : "text-muted-foreground"}>{professional.isActive ? "Ativo" : "Desativado"}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="rounded-lg bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Registro</p>
                        <div className="font-medium">{professional.crm ?? "—"}</div>
                    </div>

                    <div className="rounded-lg bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <div className="font-medium break-words">{professional.email ?? "—"}</div>
                    </div>

                    <div className="rounded-lg bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <div className="font-medium">{professional.phone ?? "—"}</div>
                    </div>

                    <div className="rounded-lg bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Pacientes ativos</p>
                        <div className="font-medium">{professional.patientsActive ?? "—"} pacientes</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm">Ver agenda</button>
                    <button className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm" onClick={() => onEdit(professional.id)}>
                        Editar perfil
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalProfessionalDetails
