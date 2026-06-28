import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { AlertTriangle, CheckCircle2, UserCheck } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { CpfNameSearch } from "@/components/cpf-name-search"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import {
    professionalsService,
    type ProfessionalCpfLookupResponse,
} from "@/services/professionals.service"
import { ToastContainer, useToast } from "./Componentes/Toast"
import { digitsOnly, formatCpf } from "./edicao-profissionais"
import { BackButton, SaveButton } from "@/components/ui/buttons"

type ProfessionalRole = {
    id: string
    description: string
}

function parseProfessionalRoles(data: unknown): ProfessionalRole[] {
    const payload = data as { data?: unknown; items?: unknown; roles?: unknown }
    const source = Array.isArray(data)
        ? data
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
                ? payload.items
                : Array.isArray(payload?.roles)
                    ? payload.roles
                    : []

    return source.flatMap((item) => {
        if (!item || typeof item !== "object") {
            return []
        }

        const role = item as Record<string, unknown>
        const id = role.id
        const description = role.description

        if (typeof id !== "string" || typeof description !== "string") {
            return []
        }

        return [{ id, description }]
    })
}

export function ImportarProfissionais() {
    const navigate = useNavigate()
    const { sessionUnit, isLoading: isSessionUnitLoading } = useSessionUnit()
    const { toasts, dismiss, toast } = useToast()
    const [cpf, setCpf] = useState("")
    const [lookupResult, setLookupResult] = useState<ProfessionalCpfLookupResponse | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const [roles, setRoles] = useState<ProfessionalRole[]>([])
    const [isRolesLoading, setIsRolesLoading] = useState(false)
    const [rolesError, setRolesError] = useState("")
    const [roleId, setRoleId] = useState("")
    const [searchMode, setSearchMode] = useState<"cpf" | "nome">("cpf")
    const [nameInput, setNameInput] = useState("")
    const [nameResults, setNameResults] = useState<Array<{ id: string; name: string; cpf: string }>>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [isNameSearching, setIsNameSearching] = useState(false)
    const skipNameSearchRef = useRef(false)
    const nameResultsRawRef = useRef<ProfessionalCpfLookupResponse[]>([])
    const [linkSuccess, setLinkSuccess] = useState(false)
    const linkSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const selectedUnitId = sessionUnit?.selectedUnitId ?? null
    const cpfDigits = useMemo(() => digitsOnly(cpf), [cpf])
    const isValidCpf = cpfDigits.length === 11
    const hasLookupResult = Boolean(lookupResult && Object.keys(lookupResult).length > 0)
    const alreadyLinked = Boolean(lookupResult?.professionalUnitId)

    useEffect(() => {
        const controller = new AbortController()

        async function loadRoles() {
            setIsRolesLoading(true)
            setRolesError("")

            try {
                const data = await fetchWithAuth<unknown>(`${authBaseUrl}/roles?isActive=true&internal=false`, {
                    signal: controller.signal,
                })
                setRoles(parseProfessionalRoles(data))
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return
                }

                setRoles([])
                setRolesError("Não foi possível carregar os cargos.")
            } finally {
                setIsRolesLoading(false)
            }
        }

        void loadRoles()

        return () => {
            controller.abort()
        }
    }, [])

    useEffect(() => {
        if (skipNameSearchRef.current) {
            skipNameSearchRef.current = false
            return
        }
        if (searchMode !== "nome" || nameInput.trim().length < 3) {
            setNameResults([])
            setShowDropdown(false)
            return
        }
        setIsNameSearching(true)
        const timer = setTimeout(async () => {
            try {
                const data = await fetchWithAuth<ProfessionalCpfLookupResponse[]>(
                    `${authBaseUrl}/professionals/professional-by-user-name?name=${encodeURIComponent(nameInput.trim())}`,
                )
                const raw = Array.isArray(data) ? data : []
                nameResultsRawRef.current = raw
                const results = raw.flatMap((item) => {
                    const id = item.userId ?? item.id ?? ""
                    const name = item.socialName || item.name || ""
                    const cpf = item.cpf ? formatCpf(item.cpf) : ""
                    return id ? [{ id, name, cpf }] : []
                })
                setNameResults(results)
                setShowDropdown(results.length > 0)
            } catch {
                setNameResults([])
                setShowDropdown(false)
            } finally {
                setIsNameSearching(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [nameInput, searchMode])

    function handleSelectMode(mode: "cpf" | "nome") {
        setSearchMode(mode)
        setLookupResult(null)
        setCpf("")
        setNameInput("")
        setNameResults([])
        setShowDropdown(false)
        setRoleId("")
    }

    async function handleCpfSearch(overrideCpf?: string) {
        const cpfToSearch = overrideCpf ?? cpfDigits

        if (!selectedUnitId) {
            toast.error("Selecione uma unidade antes de cadastrar profissionais.")
            return
        }

        if (cpfToSearch.length !== 11) {
            toast.error("Informe um CPF com 11 digitos.")
            return
        }

        setIsChecking(true)
        setLookupResult(null)
        setRoleId("")

        try {
            const result = await professionalsService.checkUserByCpf(cpfToSearch)

            const isEmptyResult =
                !result || (typeof result === "object" && Object.keys(result).length === 0)

            if (isEmptyResult) {
                navigate(`/profissionais/cadastro?cpf=${cpfToSearch}`)
                return
            }

            setLookupResult(result)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao verificar CPF.")
        } finally {
            setIsChecking(false)
        }
    }

    async function handleLinkUser() {
        if (!selectedUnitId || !isValidCpf) {
            toast.error("Nao foi possivel identificar a unidade ou o CPF.")
            return
        }

        if (!roleId) {
            toast.error("Selecione um cargo para vincular o profissional.")
            return
        }

        setIsLinking(true)

        try {
            const patientExists = Boolean(lookupResult?.patientId)
            const professionalExists = Boolean(lookupResult?.professionalId)

            await professionalsService.linkUserToUnit(cpfDigits, { roleId, patientExists, professionalExists })
            setCpf("")
            setNameInput("")
            setLookupResult(null)
            setRoleId("")
            setNameResults([])
            setShowDropdown(false)
            setLinkSuccess(true)
            if (linkSuccessTimerRef.current) clearTimeout(linkSuccessTimerRef.current)
            linkSuccessTimerRef.current = setTimeout(() => setLinkSuccess(false), 5000)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao vincular profissional.")
        } finally {
            setIsLinking(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Importação de Profissional" />
            {linkSuccess && (
                <div className="flex items-center gap-3 bg-green-600 px-6 py-3 text-white text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Profissional vinculado à unidade atual.
                </div>
            )}

            <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8">
                    <div className="flex flex-col flex-1 gap-5">
                        <div className="grid gap-5">
                            <CpfNameSearch
                                cpfValue={cpf}
                                onCpfChange={(e) => {
                                    setCpf(formatCpf(e.target.value))
                                    setLookupResult(null)
                                }}
                                onSearch={handleCpfSearch}
                                isSearching={isChecking}
                                isValidCpf={isValidCpf}
                                disabled={isSessionUnitLoading || isChecking || isLinking}
                                searchMode={searchMode}
                                onModeChange={handleSelectMode}
                                nameValue={nameInput}
                                onNameChange={(e) => { setNameInput(e.target.value); setLookupResult(null) }}
                                isNameSearching={isNameSearching}
                                nameResults={nameResults}
                                showDropdown={showDropdown}
                                onSelectResult={(result) => {
                                    const full = nameResultsRawRef.current.find(
                                        (r) => (r.userId ?? r.id) === result.id
                                    )
                                    if (!full) return
                                    skipNameSearchRef.current = true
                                    setCpf(result.cpf)
                                    setNameInput(result.name)
                                    setShowDropdown(false)
                                    setLookupResult(full)
                                    setRoleId("")
                                }}
                                noResultsText="Nenhum usuário encontrado."
                            />

                            {!hasLookupResult && !isChecking && (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center text-muted-foreground">
                                    <UserCheck className="h-10 w-10 opacity-20" />
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium">Nenhum profissional selecionado</p>
                                        <p className="text-xs">Busque pelo CPF ou nome para importar ou cadastrar.</p>
                                    </div>
                                </div>
                            )}

                            {hasLookupResult ? (
                                <div className="grid gap-4">
                                    {alreadyLinked ? (
                                        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="grid gap-0.5">
                                                <p className="font-semibold text-foreground">
                                                    {lookupResult?.socialName || lookupResult?.name || "—"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {lookupResult?.cpf ? formatCpf(lookupResult.cpf) : cpf}
                                                </p>
                                                <p className="mt-1.5 text-sm text-amber-700 dark:text-amber-400">
                                                    Este profissional já está vinculado à unidade atual.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                                                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="grid gap-0.5">
                                                <p className="font-semibold text-foreground">
                                                    {lookupResult?.socialName || lookupResult?.name || "—"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {lookupResult?.cpf ? formatCpf(lookupResult.cpf) : cpf}
                                                </p>
                                                <p className="mt-1.5 text-sm text-green-700 dark:text-green-400">
                                                    Cadastro encontrado. Selecione o cargo abaixo e clique em "Importar".
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {!alreadyLinked ? (
                                        <label className="grid gap-2">
                                            <span className="text-sm font-medium">Cargo</span>
                                            <select
                                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                value={roleId}
                                                onChange={(event) => setRoleId(event.target.value)}
                                                disabled={isRolesLoading || roles.length === 0 || isLinking}
                                            >
                                                <option value="">
                                                    {isRolesLoading ? "Carregando cargos..." : "Selecione um cargo"}
                                                </option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.description}
                                                    </option>
                                                ))}
                                            </select>
                                            {rolesError ? (
                                                <span className="text-xs text-destructive">
                                                    {rolesError}
                                                </span>
                                            ) : null}
                                        </label>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-auto flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                                <div className="flex gap-2">
                                    <BackButton onClick={() => navigate("/profissionais")} />
                                    <SaveButton
                                        type="button"
                                        onClick={handleLinkUser}
                                        isSaving={isLinking}
                                        disabled={isLinking || alreadyLinked || !roleId || !hasLookupResult}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
            </main>

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    )
}
