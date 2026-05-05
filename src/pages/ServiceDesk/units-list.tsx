import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Building2, Plus, Trash2 } from "lucide-react"
import { z } from "zod"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminUnitsService, type AdminUnit } from "@/services/admin/admin-units.service"

type NewUnitForm = {
    name: string
    cnpj: string
    address: string
    city: string
    state: string
    phone: string
    email: string
    ownerName: string
    ownerEmail: string
    ownerCpf: string
    ownerBirthdate: string
    ownerPhone: string
    ownerPassword: string
}

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida. Use o formato YYYY-MM-DD")

const createAdminUnitPayloadSchema = z
    .object({
        name: z.string().min(1, "Nome da unidade e obrigatorio"),
        cnpj: z.string().min(1, "CNPJ e obrigatorio"),
        address: z.string().min(1, "Endereco e obrigatorio"),
        city: z.string().min(1, "Cidade e obrigatoria"),
        state: z.string().length(2, "UF deve ter 2 caracteres"),
        phone: z.string().min(8, "Telefone deve ter no minimo 8 caracteres"),
        email: z.email("E-mail da unidade invalido"),
        owner: z
            .object({
                name: z.string().min(1, "Nome do dono e obrigatorio"),
                email: z.email("E-mail do dono invalido"),
                cpf: z.string().min(11, "CPF deve ter no minimo 11 caracteres").max(14, "CPF invalido"),
                birthdate: dateStringSchema,
                phone: z.string().min(8, "Telefone do dono deve ter no minimo 8 caracteres"),
                password: z.string().min(8, "Senha do dono deve ter no minimo 8 caracteres"),
            })
            .strict(),
    })
    .strict()

function mapCreateUnitErrorMessage(message: string) {
    if (message === "Owner e-mail already exists") {
        return "Ja existe um usuario com este e-mail. Use outro e-mail para o dono da unidade."
    }

    if (message === "Owner CPF already exists") {
        return "Ja existe um usuario com este CPF. Verifique os dados do dono da unidade."
    }

    if (message === "Unit CNPJ already exists") {
        return "Ja existe uma unidade com este CNPJ."
    }

    if (message === "Duplicate user or unit data") {
        return "Ja existe um cadastro com os dados informados (e-mail, CPF ou CNPJ)."
    }

    if (message === "Internal server error") {
        return "Nao foi possivel criar a unidade agora. Tente novamente em instantes."
    }

    return message
}

const initialForm: NewUnitForm = {
    name: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    ownerName: "",
    ownerEmail: "",
    ownerCpf: "",
    ownerBirthdate: "",
    ownerPhone: "",
    ownerPassword: "",
}

export function ServiceDeskUnitsList() {
    const [units, setUnits] = useState<AdminUnit[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState<NewUnitForm>(initialForm)
    const [modalError, setModalError] = useState<string | null>(null)

    const loadUnits = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await adminUnitsService.list()
            setUnits(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao listar unidades")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadUnits()
    }, [])

    const handleCreateUnit = async (event: React.FormEvent) => {
        event.preventDefault()
        setModalError(null)

        const payload = {
            name: form.name,
            cnpj: form.cnpj,
            address: form.address,
            city: form.city,
            state: form.state,
            phone: form.phone,
            email: form.email,
            owner: {
                name: form.ownerName,
                email: form.ownerEmail,
                cpf: form.ownerCpf,
                birthdate: form.ownerBirthdate,
                phone: form.ownerPhone,
                password: form.ownerPassword,
            },
        }

        const validationResult = createAdminUnitPayloadSchema.safeParse(payload)

        if (!validationResult.success) {
            setModalError(validationResult.error.issues[0]?.message ?? "Verifique os dados informados")
            return
        }

        setIsSaving(true)

        try {
            await adminUnitsService.create(validationResult.data)

            setForm(initialForm)
            setModalError(null)
            setIsModalOpen(false)
            await loadUnits()
        } catch (err) {
            const rawMessage = err instanceof Error ? err.message : "Falha ao criar unidade"
            setModalError(mapCreateUnitErrorMessage(rawMessage))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (unitId: string) => {
        try {
            await adminUnitsService.remove(unitId)
            await loadUnits()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao excluir unidade")
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader title="Administração de Unidades" />
            <div className="mx-auto max-w-6xl p-4 sm:p-6">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">ServiceDesk interno Alfamed</p>

                        <Button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                            <Plus className="h-4 w-4 mr-1" />
                            Nova Unidade
                        </Button>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    ) : null}

                    {isLoading ? (
                        <p className="mt-8 text-sm text-slate-500">Carregando unidades...</p>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {units.map((unit) => (
                                <article key={unit.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                                                <Building2 className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <h2 className="font-semibold text-slate-900 dark:text-white">{unit.name}</h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{unit.city ?? "Sem cidade"} / {unit.state ?? "--"}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => void handleDelete(unit.id)}
                                            className="rounded-md p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                                            title="Excluir unidade"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <dl className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                        <div><span className="font-medium">CNPJ:</span> {unit.cnpj ?? "-"}</div>
                                        <div><span className="font-medium">E-mail:</span> {unit.email ?? "-"}</div>
                                        <div><span className="font-medium">Profissionais:</span> {unit.professionalsCount}</div>
                                    </dl>

                                    <Link
                                        to={`/admin/unidades/${unit.id}`}
                                        className="mt-4 inline-flex rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        Ver detalhes
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 bg-slate-900/50 px-4 py-8 overflow-y-auto">
                    <div className="mx-auto max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Nova unidade</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Inclui criação automática do usuário dono e vínculo profissional.</p>

                        <form onSubmit={handleCreateUnit} className="mt-4 grid gap-3">
                            {modalError ? (
                                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                                    {modalError}
                                </div>
                            ) : null}

                            <div className="grid sm:grid-cols-2 gap-3">
                                <Input placeholder="Nome da unidade" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                                <Input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm((p) => ({ ...p, cnpj: e.target.value }))} required />
                            </div>
                            <Input placeholder="Endereço" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
                            <div className="grid sm:grid-cols-3 gap-3">
                                <Input placeholder="Cidade" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required />
                                <Input placeholder="UF" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase() }))} maxLength={2} required />
                                <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
                            </div>
                            <Input placeholder="E-mail da unidade" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />

                            <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Dados do dono da unidade</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Input placeholder="Nome" value={form.ownerName} onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} required />
                                <Input placeholder="E-mail" value={form.ownerEmail} onChange={(e) => setForm((p) => ({ ...p, ownerEmail: e.target.value }))} required />
                                <Input placeholder="CPF" value={form.ownerCpf} onChange={(e) => setForm((p) => ({ ...p, ownerCpf: e.target.value }))} required />
                                <Input type="date" value={form.ownerBirthdate} onChange={(e) => setForm((p) => ({ ...p, ownerBirthdate: e.target.value }))} required />
                                <Input placeholder="Telefone" value={form.ownerPhone} onChange={(e) => setForm((p) => ({ ...p, ownerPhone: e.target.value }))} required />
                                <Input type="password" placeholder="Senha inicial" value={form.ownerPassword} onChange={(e) => setForm((p) => ({ ...p, ownerPassword: e.target.value }))} required />
                            </div>

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => {
                                    setModalError(null)
                                    setIsModalOpen(false)
                                }} className="cursor-pointer">Cancelar</Button>
                                <Button type="submit" disabled={isSaving} className="cursor-pointer">{isSaving ? "Criando..." : "Criar unidade"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
