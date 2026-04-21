import { Mail, Phone, Stethoscope, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Professional } from "@/services/professionals.service"

interface ProfessionalCardProps {
    professional: Professional
    onToggleActive: (id: string, isActive: boolean) => Promise<void>
    onEdit: (professional: Professional) => void
    onDelete: (professional: Professional) => void
}

/** Generates a deterministic color class from a string (userId). */
function getAvatarColor(seed: string): string {
    const colors = [
        "bg-blue-500",
        "bg-violet-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-rose-500",
        "bg-cyan-500",
        "bg-fuchsia-500",
        "bg-orange-500",
        "bg-teal-500",
        "bg-indigo-500",
    ]
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

/** Gets initials from the userId (first 2 chars uppercased). */
function getInitials(userId: string): string {
    return userId.slice(0, 2).toUpperCase()
}

/** Truncates and abbreviates a userId to a display-friendly pseudonym. */
function getDisplayName(userId: string): string {
    return `Prof. ${userId.slice(0, 8).toUpperCase()}`
}

/** Derives a short display email from userId. */
function getDisplayEmail(userId: string): string {
    return `${userId.slice(0, 8)}@alfamed.com`
}

export function ProfessionalCard({
    professional,
    onToggleActive,
    onEdit,
    onDelete,
}: ProfessionalCardProps) {
    const { id, userId, isActive } = professional
    const avatarColor = getAvatarColor(userId)
    const initials = getInitials(userId)
    const displayName = getDisplayName(userId)
    const displayEmail = getDisplayEmail(userId)

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        onToggleActive(id, isActive)
    }

    return (
        <div
            className={cn(
                "group relative flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer",
                "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
            )}
            onClick={() => onEdit(professional)}
        >
            {/* Header: Avatar + Name + Status */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                            avatarColor,
                        )}
                    >
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p
                            className="text-sm font-semibold text-gray-900 truncate max-w-[120px]"
                            title={displayName}
                        >
                            {displayName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-gray-500">
                            <Stethoscope className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs truncate">Clínica Geral</span>
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <button
                    id={`toggle-status-${id}`}
                    onClick={handleToggle}
                    title={isActive ? "Clique para desativar" : "Clique para ativar"}
                    className={cn(
                        "flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        "transition-all duration-150 cursor-pointer",
                        isActive
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200",
                    )}
                >
                    <span
                        className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isActive ? "bg-green-500" : "bg-gray-400",
                        )}
                    />
                    {isActive ? "Ativo" : "Desativado"}
                </button>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{displayEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">(11) 9 0000-0000</span>
                </div>
            </div>

            {/* Footer: CRM + Patient count */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto text-xs text-gray-500">
                <span className="font-medium text-gray-600">
                    CRM/SP {id.slice(0, 6).replace(/-/g, "").toUpperCase()}
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-semibold text-gray-700">—</span>
                    <span>pacientes</span>
                </div>
            </div>

            {/* Hover actions */}
            <div
                className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    "flex items-end justify-end p-3 pointer-events-none group-hover:pointer-events-auto",
                )}
            >
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        id={`edit-professional-${id}`}
                        onClick={() => onEdit(professional)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                        Editar
                    </button>
                    <button
                        id={`delete-professional-${id}`}
                        onClick={() => onDelete(professional)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium border border-red-200 shadow-sm"
                    >
                        Remover
                    </button>
                </div>
            </div>
        </div>
    )
}
