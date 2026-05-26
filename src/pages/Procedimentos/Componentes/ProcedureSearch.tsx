import { Search } from "lucide-react"

interface ProcedureSearchProps {
    value: string
    onChange: (value: string) => void
}

export function ProcedureSearch({ value, onChange }: ProcedureSearchProps) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
            <input
                id="search-procedures"
                type="text"
                placeholder="Buscar procedimento..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-56 rounded-full border border-border bg-popover py-1.5 pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
        </div>
    )
}