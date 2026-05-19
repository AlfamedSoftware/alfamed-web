import { Search } from "lucide-react"

interface ProfessionalSearchProps {
    value: string
    onChange: (value: string) => void
}

export function ProfessionalSearch({ value, onChange }: ProfessionalSearchProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 pointer-events-none" />
            <input
                id="search-professionals"
                type="text"
                placeholder="Buscar profissional..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-56 pl-9 pr-3 py-1.5 text-sm rounded-full border border-border bg-popover text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
        </div>
    )
}
