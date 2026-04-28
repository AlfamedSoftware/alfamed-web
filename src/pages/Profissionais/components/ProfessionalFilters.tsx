import { cn } from "@/lib/utils"
import type { ProfessionalFilter } from "@/hooks/use-professionals"

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
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600",
                        )}
                    >
                        {label}
                        <span
                            className={cn(
                                "text-xs font-semibold",
                                isActive ? "text-blue-100" : "text-gray-400",
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
