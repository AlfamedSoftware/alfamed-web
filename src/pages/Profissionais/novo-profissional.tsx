import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { CheckCircle2, Link2, Loader2, Search } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import {
    professionalsService,
    type ProfessionalCpfLookupResponse,
} from "@/Servicos/professionals.service"
import { ToastContainer, useToast } from "./Componentes/Toast"
import { digitsOnly, formatCpf } from "./edicao-profissionais"

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

export function NovoProfissional() {
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

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedUnitId) {
            toast.error("Selecione uma unidade antes de cadastrar profissionais.")
            return
        }

        if (!isValidCpf) {
            toast.error("Informe um CPF com 11 digitos.")
            return
        }

        setIsChecking(true)
        setLookupResult(null)
        setRoleId("")

        try {
            const result = await professionalsService.checkUserByCpf(cpfDigits)

            const isEmptyResult =
                !result || (typeof result === "object" && Object.keys(result).length === 0)

            if (isEmptyResult) {
                navigate(`/cadastro-profissionais?cpf=${cpfDigits}`)
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
            toast.success("Profissional vinculado a unidade atual.")
            navigate("/profissionais")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao vincular profissional.")
        } finally {
            setIsLinking(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Importar Profissional" />

            <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
                <div className="grid gap-5">
                    <form onSubmit={handleSubmit} className="grid gap-5">
                        <div className="grid gap-5">
                            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                                <label className="grid gap-2">
                                    <span className="text-sm font-medium">CPF</span>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="000.000.000-00"
                                        value={cpf}
                                        onChange={(event) => {
                                            setCpf(formatCpf(event.target.value))
                                            setLookupResult(null)
                                        }}
                                        className="h-10 rounded-md"
                                        disabled={isChecking || isLinking}
                                    />
                                </label>
                                <Button
                                    type="submit"
                                    disabled={isSessionUnitLoading || isChecking || isLinking}
                                    className="w-full gap-2 sm:w-auto h-10 cursor-pointer"
                                >
                                    {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {isChecking ? "Verificando..." : "Verificar CPF"}
                                </Button>
                            </div>

                            {hasLookupResult ? (
                                <div className="grid gap-4">
                                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                                            <div className="grid gap-1 text-sm">
                                                {alreadyLinked ? (
                                                    <p className="font-semibold text-foreground">
                                                        Este usuário já está vinculado a unidade atual.
                                                    </p>
                                                ) : (
                                                    <p className="font-semibold text-muted-foreground">
                                                        Este CPF já possui cadastro no sistema. <br />Selecione o cargo e clique em "Importar" para associa-lo a unidade atual.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

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

                        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground"></p>
                            <div className="flex flex-row items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/profissionais")}
                                    className="w-fit gap-2 cursor-pointer"
                                >
                                    Voltar
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleLinkUser}
                                    disabled={isLinking || alreadyLinked || !roleId || !hasLookupResult}
                                    className="w-fit gap-2 cursor-pointer"
                                >
                                    {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                                    {isLinking ? "Importando..." : "Importar"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    )
}
