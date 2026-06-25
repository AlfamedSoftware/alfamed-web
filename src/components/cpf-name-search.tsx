import { Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface SearchResultItem {
    id: string
    name: string
    cpf: string
}

type SearchMode = "cpf" | "nome"

interface CpfNameSearchProps {
    cpfValue: string
    onCpfChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    cpfError?: string | null
    onSearch: () => void
    isSearching?: boolean
    isValidCpf: boolean
    disabled?: boolean

    // Modo toggle + busca por nome — só são renderizados se onNameChange for fornecido
    searchMode?: SearchMode
    onModeChange?: (mode: SearchMode) => void
    nameValue?: string
    onNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    isNameSearching?: boolean
    nameResults?: SearchResultItem[]
    showDropdown?: boolean
    onSelectResult?: (result: SearchResultItem) => void
    noResultsText?: string
}

export function CpfNameSearch({
    cpfValue,
    onCpfChange,
    cpfError,
    onSearch,
    isSearching = false,
    isValidCpf,
    disabled = false,
    searchMode = "cpf",
    onModeChange,
    nameValue = "",
    onNameChange,
    isNameSearching = false,
    nameResults = [],
    showDropdown = false,
    onSelectResult,
    noResultsText = "Nenhum resultado encontrado.",
}: CpfNameSearchProps) {
    const hasNomeMode = Boolean(onNameChange)
    const showCpf = !hasNomeMode || searchMode === "cpf"

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex gap-2 items-center">
                {hasNomeMode && (
                    <div className="flex rounded-md border border-border overflow-hidden shrink-0 text-sm font-medium">
                        <button
                            type="button"
                            onClick={() => onModeChange?.("cpf")}
                            className={`px-4 py-2 transition-colors cursor-pointer ${searchMode === "cpf" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                        >
                            CPF
                        </button>
                        <button
                            type="button"
                            onClick={() => onModeChange?.("nome")}
                            className={`px-4 py-2 transition-colors border-l border-border cursor-pointer ${searchMode === "nome" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                        >
                            Nome
                        </button>
                    </div>
                )}

                {showCpf ? (
                    <>
                        <Input
                            value={cpfValue}
                            onChange={onCpfChange}
                            onKeyDown={(e) => e.key === "Enter" && !isSearching && isValidCpf && onSearch()}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            inputMode="numeric"
                            disabled={disabled}
                            className={`flex-1 ${cpfError ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                        />
                        <Button
                            size="default"
                            type="button"
                            onClick={() => onSearch()}
                            disabled={disabled || isSearching || !isValidCpf}
                            className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            <Search className="w-4 h-4 mr-1.5" />
                            {isSearching ? "Buscando..." : "Buscar"}
                        </Button>
                    </>
                ) : (
                    <div className="relative flex-1">
                        <Input
                            value={nameValue}
                            onChange={onNameChange}
                            placeholder="Digite o nome..."
                            className="pr-9"
                            autoFocus
                        />
                        {isNameSearching ? (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        ) : (
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        )}

                        {showDropdown && nameResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                                {nameResults.map((result) => (
                                    <button
                                        key={result.id}
                                        type="button"
                                        onClick={() => onSelectResult?.(result)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0 cursor-pointer"
                                    >
                                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{result.name}</p>
                                            <p className="text-xs text-muted-foreground">{result.cpf}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!isNameSearching && nameValue.trim().length >= 3 && nameResults.length === 0 && !showDropdown && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-md border border-border bg-popover px-4 py-3 text-sm text-muted-foreground shadow-lg">
                                {noResultsText}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {cpfError && showCpf && (
                <span className="text-xs text-red-500 pl-1">{cpfError}</span>
            )}
        </div>
    )
}
