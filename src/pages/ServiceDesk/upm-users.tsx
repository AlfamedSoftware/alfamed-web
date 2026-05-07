import { useEffect, useMemo, useState } from "react"
import { UserPlus } from "lucide-react"
import { z } from "zod"
import { useNavigate } from "react-router"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PasswordInput from "@/components/ui/password-input"
import { adminUnitsService, type AdminUnit } from "@/services/admin/admin-units.service"
import { adminUpmService, type AdminUpmUser } from "@/services/admin/admin-upm.service"
import { UpmUserCard } from "./components/UpmUserCard"

type NewUpmUserForm = {
    unitId: string
    name: string
    emailLocalPart: string
    cpf: string
    birthdate: string
    phone: string
    password: string
}

const INTERNAL_EMAIL_DOMAIN = "alfamed.com"

function normalizeEmailLocalPart(value: string) {
    const trimmed = value.trim().toLowerCase()
    return trimmed.includes("@") ? trimmed.split("@")[0] : trimmed
}

function digitsOnly(value: string) {
    return value.replace(/\D/g, "")
}

function formatCpf(value: string) {
    const digits = digitsOnly(value).slice(0, 11)
    const part1 = digits.slice(0, 3)
    const part2 = digits.slice(3, 6)
    const part3 = digits.slice(6, 9)
    const part4 = digits.slice(9, 11)

    if (!part1) return ""
    if (!part2) return part1
    if (!part3) return `${part1}.${part2}`
    if (!part4) return `${part1}.${part2}.${part3}`
    return `${part1}.${part2}.${part3}-${part4}`
}

function formatPhone(value: string) {
    const digits = digitsOnly(value).slice(0, 11)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, digits.length > 10 ? 7 : 6)
    const second = digits.slice(digits.length > 10 ? 7 : 6, digits.length > 10 ? 11 : 10)

    if (!ddd) return ""
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}

const createUpmUserSchema = z.object({
    unitId: z.string().uuid("Selecione uma unidade válida"),
    name: z.string().min(1, "Nome é obrigatório"),
    emailLocalPart: z
        .string()
        .min(1, "Informe o e-mail")
        .regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, traço e underscore no e-mail"),
    cpf: z.string().refine((value) => digitsOnly(value).length === 11, "CPF inválido"),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    phone: z.string().refine((value) => digitsOnly(value).length >= 10, "Telefone inválido"),
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
})

const DEFAULT_UNIT_ID = "8b2f9e64-8c48-4d47-b6bf-e0c75114f4d6"

const initialForm: NewUpmUserForm = {
    unitId: DEFAULT_UNIT_ID,
    name: "",
    emailLocalPart: "",
    cpf: "",
    birthdate: "",
    phone: "",
    password: "",
}

function mapCreateUserErrorMessage(message: string) {
    if (message === "User e-mail already exists") {
        return "Já existe um usuário com este e-mail."
    }

    if (message === "User CPF already exists") {
        return "Já existe um usuário com este CPF."
    }

    if (message === "Unit not found") {
        return "Unidade não encontrada. Atualize a página e tente novamente."
    }

    if (message === "Duplicate user or professional data") {
        return "Já existe cadastro com os dados informados."
    }

    if (message === "Internal server error") {
        return "Não foi possível concluir a criação agora. Tente novamente."
    }

    return message
}

export function ServiceDeskUpmUsers() {
    const navigate = useNavigate()
    const [users, setUsers] = useState<AdminUpmUser[]>([])
    const [units, setUnits] = useState<AdminUnit[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)
    const [form, setForm] = useState<NewUpmUserForm>(initialForm)

    const loadData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [usersData, unitsData] = await Promise.all([
                adminUpmService.listUsers(),
                adminUnitsService.list(),
            ])

            setUsers(usersData)
            setUnits(unitsData)

            setForm((prev) => ({ ...prev, unitId: prev.unitId || DEFAULT_UNIT_ID }))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar dados da UPM")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
    }, [])

    const activeUsersCount = useMemo(() => users.filter((item) => item.status).length, [users])

    const handleCreateUser = async (event: React.FormEvent) => {
        event.preventDefault()
        setModalError(null)

        const validationResult = createUpmUserSchema.safeParse(form)

        if (!validationResult.success) {
            setModalError(validationResult.error.issues[0]?.message ?? "Verifique os dados informados")
            return
        }

        const payload = {
            unitId: validationResult.data.unitId,
            user: {
                name: validationResult.data.name,
                email: `${validationResult.data.emailLocalPart}@${INTERNAL_EMAIL_DOMAIN}`,
                cpf: digitsOnly(validationResult.data.cpf),
                birthdate: validationResult.data.birthdate,
                phone: digitsOnly(validationResult.data.phone),
                password: validationResult.data.password,
            },
        }

        setIsSaving(true)

        try {
            await adminUpmService.createUser(payload)

            setForm({
                ...initialForm,
                unitId: DEFAULT_UNIT_ID,
            })
            setModalError(null)
            setIsModalOpen(false)
            await loadData()
        } catch (err) {
            const rawMessage = err instanceof Error ? err.message : "Falha ao criar usuário interno"
            setModalError(mapCreateUserErrorMessage(rawMessage))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader title="UPM - Usuários e Permissões" />
            <div className="mx-auto max-w-6xl p-4 sm:p-6">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Usuários internos com permissão Alfamed
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Total: <span className="font-semibold">{users.length}</span> · Ativos: <span className="font-semibold">{activeUsersCount}</span>
                            </p>
                        </div>

                        <Button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Novo usuário interno
                        </Button>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    ) : null}

                    {isLoading ? (
                        <p className="mt-8 text-sm text-slate-500">Carregando usuários internos...</p>
                    ) : users.length === 0 ? (
                        <p className="mt-8 text-sm text-slate-500">Nenhum usuário interno com role Alfamed encontrado.</p>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map((user) => (
                                <UpmUserCard
                                    key={user.professionalUnitId}
                                    user={user}
                                    onClick={(u) => navigate(`/admin/upm/usuarios/${u.professionalUnitId}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 bg-slate-900/50 px-4 py-8 overflow-y-auto">
                    <div className="mx-auto max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Novo usuário interno Alfamed</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            O usuário já será criado com permissão Alfamed.
                        </p>

                        <form onSubmit={handleCreateUser} className="mt-4 grid gap-3">
                            {modalError ? (
                                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                                    {modalError}
                                </div>
                            ) : null}

                            <div className="grid sm:grid-cols-2 gap-3">
                                {/* Unit is fixed to DEFAULT_UNIT_ID per request */}
                                <div className="h-9 w-full flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                                    {units.find((u) => u.id === DEFAULT_UNIT_ID)?.name ?? "Unidade Alfamed"}
                                </div>
                                <Input
                                    placeholder="Nome completo"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="flex h-9 w-full overflow-hidden rounded-md border border-slate-300 bg-white text-sm shadow-xs focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:focus-within:border-slate-500 dark:focus-within:ring-slate-500/40">
                                    <Input
                                        placeholder="nome"
                                        value={form.emailLocalPart}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                emailLocalPart: normalizeEmailLocalPart(e.target.value),
                                            }))
                                        }
                                        className="h-full flex-1 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                                        required
                                    />
                                    <div className="flex items-center border-l border-slate-300 bg-slate-100 px-3 text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                        @{INTERNAL_EMAIL_DOMAIN}
                                    </div>
                                </div>
                                <Input
                                    inputMode="numeric"
                                    placeholder="000.000.000-00"
                                    value={form.cpf}
                                    onChange={(e) => setForm((p) => ({ ...p, cpf: formatCpf(e.target.value) }))}
                                    required
                                />
                                <Input
                                    type="date"
                                    value={form.birthdate}
                                    onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))}
                                    required
                                />
                                <Input
                                    inputMode="numeric"
                                    placeholder="(11) 98765-4321"
                                    value={form.phone}
                                    onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                                    required
                                />
                            </div>

                            <PasswordInput
                                placeholder="Senha inicial"
                                value={form.password}
                                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                required
                            />

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setModalError(null)
                                        setIsModalOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSaving} className="cursor-pointer">
                                    {isSaving ? "Criando..." : "Criar usuário"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
