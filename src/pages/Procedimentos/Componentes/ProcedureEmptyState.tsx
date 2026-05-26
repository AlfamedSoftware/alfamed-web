import { ClipboardList } from "lucide-react"

interface ProcedureEmptyStateProps {
    isFiltered?: boolean
}

export function ProcedureEmptyState({ isFiltered = false }: ProcedureEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <ClipboardList className="h-8 w-8 text-blue-400" />
            </div>

            <h3 className="mb-1 text-base font-semibold text-muted-foreground">
                {isFiltered ? "Nenhum procedimento encontrado" : "Nenhum procedimento cadastrado"}
            </h3>

            <p className="max-w-xs text-sm text-muted-foreground">
                {isFiltered
                    ? "Tente ajustar os filtros ou a busca para encontrar o que procura."
                    : "Clique em \"Novo Procedimento\" para começar a cadastrar procedimentos da unidade."}
            </p>
        </div>
    )
}