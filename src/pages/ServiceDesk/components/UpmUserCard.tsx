import { Mail, Phone, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminUpmUser } from "@/Servicos/admin/admin-upm.service"

interface UpmUserCardProps {
    user: AdminUpmUser
    onClick?: (user: AdminUpmUser) => void
}

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
    if (!value) return "US"
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

function formatCpfDisplay(cpf: string): string {
    const digits = cpf.replace(/\D/g, "")
    if (digits.length !== 11) return cpf
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhoneDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, "")
    if (digits.length < 10) return phone
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function UpmUserCard({ user, onClick }: UpmUserCardProps) {
    const avatarColor = getAvatarColor(user.userId)
    const initials = getInitials(user.name)

    return (
        <div
            className={cn(
                "group relative flex flex-col rounded-2xl shadow-sm border p-5 cursor-pointer",
                "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                "bg-card text-card-foreground border-border",
            )}
            onClick={() => onClick?.(user)}
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
                        <p className="text-sm font-semibold truncate max-w-[140px]" title={user.name}>
                            {user.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                            <Shield className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs truncate">Alfamed</span>
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={cn(
                        "flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        user.status
                            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900"
                            : "bg-popover text-muted-foreground border border-border dark:bg-slate-700",
                    )}
                >
                    <span
                        className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            user.status ? "bg-green-500" : "bg-[var(--muted-foreground)]",
                        )}
                    />
                    {user.status ? "Ativo" : "Inativo"}
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{formatPhoneDisplay(user.phone)}</span>
                </div>
            </div>

            {/* Footer: CPF + Unit */}
            <div className="flex items-center justify-between pt-3 border-t mt-auto text-xs text-muted-foreground border-border gap-2">
                <div className="min-w-0">
                    <span className="font-medium">CPF: {formatCpfDisplay(user.cpf)}</span>
                </div>
                <div className="flex-shrink-0 text-right">
                    <span className="font-medium">{user.unitName}</span>
                </div>
            </div>
        </div>
    )
}
