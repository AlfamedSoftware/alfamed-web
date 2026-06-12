import { cn } from "@/lib/utils"

type ProcedureFilter = "all" | "active" | "inactive"

interface ProcedureFiltersProps {
    activeFilter: ProcedureFilter
    onFilterChange: (filter: ProcedureFilter) => void
    counts: {
        all: number
        active: number
        inactive: number
    }
}

const filters: { key: ProcedureFilter; label: string; countKey: keyof ProcedureFiltersProps["counts"] }[] = [
    { key: "all", label: "Todos", countKey: "all" },
    { key: "active", label: "Ativos", countKey: "active" },
    { key: "inactive", label: "Inativos", countKey: "inactive" },
]

export function ProcedureFilters({ activeFilter, onFilterChange, counts }: ProcedureFiltersProps) {
    return (
        <div className="flex items-center gap-2">
            {filters.map(({ key, label, countKey }) => {
                const isActive = activeFilter === key

                return (
                    <button
                        key={key}
                        id={`filter-${key}`}
                        onClick={() => onFilterChange(key)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-border bg-popover text-muted-foreground hover:border-blue-300 hover:text-primary",
                        )}
                    >
                        {label}
                        <span className={cn("text-xs font-semibold", isActive ? "text-primary-foreground" : "text-muted-foreground")}>
                            {counts[countKey]}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}