import { ClipboardList } from "lucide-react"

interface SpecialtyEmptyStateProps {
    isFiltered?: boolean
}

export function SpecialtyEmptyState({ isFiltered = false }: SpecialtyEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <ClipboardList className="h-8 w-8 text-blue-400" />
            </div>

            <h3 className="mb-1 text-base font-semibold text-muted-foreground">
                {isFiltered ? "Nenhuma especialidade encontrada" : "Nenhuma especialidade cadastrada"}
            </h3>

            <p className="max-w-xs text-sm text-muted-foreground">
                {isFiltered
                    ? "Tente ajustar os filtros ou a busca para encontrar o que procura."
                    : "Clique em \"Nova Especialidade\" para começar a cadastrar especialidades da unidade."}
            </p>
        </div>
    )
}