export const statusLabels: Record<string, string> = {
    scheduled: "Agendado",
    in_progress: "Em andamento",
    done: "Concluido",
    cancelled: "Cancelado",
}

export const statusClasses: Record<string, string> = {
    scheduled: "border-blue-200 bg-blue-50 text-blue-700",
    in_progress: "border-amber-200 bg-amber-50 text-amber-700",
    done: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelled: "border-red-200 bg-red-50 text-red-700",
}

export function getStatusLabel(status: string) {
    return statusLabels[status] ?? status
}

export function getStatusClass(status: string) {
    return statusClasses[status] ?? "border-border bg-muted text-muted-foreground"
}
