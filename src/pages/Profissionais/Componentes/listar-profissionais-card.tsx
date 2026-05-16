import { Mail, Phone, Stethoscope, Users } from "lucide-react"
import { useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import type { Professional } from "@/Servicos/professionals.service"

interface ProfessionalCardProps {
    professional: Professional
    onClick?: (id: string) => void
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

function getInitials(name?: string): string {
    const value = name?.trim()
    if (!value) return "PR"

    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function ProfessionalCard({ professional, onClick }: ProfessionalCardProps) {
    const { id, userId, isActive, name, email, phone } = professional
    const avatarColor = getAvatarColor(name ?? userId)
    const displayName = name?.trim() || "Profissional"
    const displayEmail = email?.trim() || "Email não informado"
    const displayPhone = phone?.trim() || professional.users?.[0]?.phone?.trim() || "Telefone não informado"
    const displayRole = professional.roles?.name || "Cargo não informado"
    const initials = getInitials(name)

    const navigate = useNavigate()

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div
            className={cn(
                "group relative flex flex-col rounded-2xl shadow-sm border p-5 cursor-pointer",
                "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                "bg-card text-card-foreground border-border",
            )}
            onClick={() => (onClick ? onClick(id) : navigate(`/profissionais/${id}`))}
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
                        <p className="text-sm font-semibold truncate max-w-[120px]" title={displayName}>
                            {displayName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                            <span className="text-xs truncate"> { displayRole }</span>
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <button
                    className={cn(
                        "flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        "transition-all duration-150 cursor-pointer",
                        isActive
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : "bg-popover text-muted-foreground hover:bg-popover border border-border",
                    )}
                >
                    <span
                        className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isActive ? "bg-green-500" : "bg-[var(--muted-foreground)]",
                        )}
                    />
                    {isActive ? "Ativo" : "Inativo"}
                </button>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{displayEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{displayPhone}</span>
                </div>
            </div>
        </div>
    )
}
