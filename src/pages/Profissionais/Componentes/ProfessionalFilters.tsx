import { cn } from "@/lib/utils"

type ProfessionalFilter = "all" | "active" | "inactive"

interface ProfessionalFiltersProps {
    activeFilter: ProfessionalFilter
    onFilterChange: (filter: ProfessionalFilter) => void
    counts: {
        all: number
        active: number
        inactive: number
    }
}

const filters: { key: ProfessionalFilter; label: string; countKey: keyof ProfessionalFiltersProps["counts"] }[] = [
    { key: "all", label: "Todos", countKey: "all" },
    { key: "active", label: "Ativos", countKey: "active" },
    { key: "inactive", label: "Desativados", countKey: "inactive" },
]

export function ProfessionalFilters({
    activeFilter,
    onFilterChange,
    counts,
}: ProfessionalFiltersProps) {
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
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                                isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-popover text-muted-foreground border border-border hover:border-blue-300 hover:text-primary",
                            )}
                    >
                        {label}
                        <span
                            className={cn(
                                "text-xs font-semibold",
                                isActive ? "text-primary-foreground" : "text-muted-foreground",
                            )}
                        >
                            {counts[countKey]}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
