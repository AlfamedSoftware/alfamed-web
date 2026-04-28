import { Stethoscope } from "lucide-react"

interface ProfessionalEmptyStateProps {
    isFiltered?: boolean
}

export function ProfessionalEmptyState({ isFiltered = false }: ProfessionalEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Stethoscope className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
                {isFiltered ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
                {isFiltered
                    ? "Tente ajustar os filtros ou a busca para encontrar o que procura."
                    : "Clique em \"Novo Profissional\" para começar a adicionar profissionais à sua equipe."}
            </p>
        </div>
    )
}
