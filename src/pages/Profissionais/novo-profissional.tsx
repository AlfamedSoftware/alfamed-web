import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, CheckCircle2, Link2, Loader2, Search, UserPlus } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
    const foundUser = hasLookupResult
        ? lookupResult?.user ?? {
              id: lookupResult?.userId ?? lookupResult?.id ?? "",
              name: lookupResult?.name,
              email: lookupResult?.email,
              phone: lookupResult?.phone,
          }
        : null
    const alreadyLinked = Boolean(
        lookupResult?.alreadyLinkedToUnit || lookupResult?.professionalUnit,
    )

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
            await professionalsService.linkUserToUnit(cpfDigits, { roleId })
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
            <PageHeader title="Verificar CPF" />

            <main className="flex-1 px-6">
                <div className="border-border py-6">
                        <CardHeader className="mb-4">
                            <CardDescription>
                                Consulte o CPF para continuar com um novo cadastro ou vincular um usuario existente.
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="grid gap-5">
                                <label className="grid gap-2">
                                    <span className="text-sm font-medium text-foreground">CPF</span>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="000.000.000-00"
                                        value={cpf}
                                        onChange={(event) => {
                                            setCpf(formatCpf(event.target.value))
                                            setLookupResult(null)
                                        }}
                                        className="h-11 rounded-xl"
                                        disabled={isChecking || isLinking}
                                    />
                                </label>

                                {hasLookupResult ? (
                                    <div className="grid gap-4">
                                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                                                <div className="grid gap-1 text-sm">
                                                    <p className="font-semibold text-foreground">Usuario ja cadastrado</p>
                                                    <p className="text-muted-foreground">
                                                        {foundUser?.name ?? "Profissional sem nome informado"}
                                                        {foundUser?.email ? ` - ${foundUser.email}` : ""}
                                                    </p>
                                                    {alreadyLinked ? (
                                                        <p className="text-muted-foreground">
                                                            Este usuario ja esta vinculado a unidade atual.
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted-foreground">
                                                            Este CPF ja possui cadastro no sistema. Selecione o cargo e clique em "Vincular unidade atual" para associa-lo a unidade selecionada.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!alreadyLinked ? (
                                            <label className="grid gap-2">
                                                <span className="text-sm font-medium text-foreground">Cargo</span>
                                                <select
                                                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                                    <span className="text-sm font-medium text-destructive">
                                                        {rolesError}
                                                    </span>
                                                ) : null}
                                            </label>
                                        ) : null}
                                    </div>
                                ) : null}
                            </CardContent>

                            <CardFooter className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/profissionais")}
                                    className="w-fit gap-2"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSessionUnitLoading || isChecking || isLinking}
                                    className="w-full gap-2 sm:w-auto"
                                >
                                    {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {isChecking ? "Verificando..." : "Verificar CPF"}
                                </Button>

                                {hasLookupResult ? (
                                    <Button
                                        type="button"
                                        onClick={handleLinkUser}
                                        disabled={isLinking || alreadyLinked || !roleId}
                                        className="w-full gap-2 sm:w-auto"
                                    >
                                        {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                                        {alreadyLinked ? "Ja vinculado" : isLinking ? "Vinculando..." : "Vincular unidade atual"}
                                    </Button>
                                ) : null}
                            </CardFooter>
                        </form>
                </div>
            </main>

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    )
}
