import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowLeft, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    adminUnitsService,
    type AdminProfessional,
    type AdminUnit,
} from "@/services/admin/admin-units.service"

type NewProfessionalForm = {
    name: string
    email: string
    cpf: string
    birthdate: string
    phone: string
    password: string
    crm: string
}

const initialProfessionalForm: NewProfessionalForm = {
    name: "",
    email: "",
    cpf: "",
    birthdate: "",
    phone: "",
    password: "",
    crm: "",
}

export function ServiceDeskUnitDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [unit, setUnit] = useState<AdminUnit | null>(null)
    const [professionals, setProfessionals] = useState<AdminProfessional[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState<NewProfessionalForm>(initialProfessionalForm)

    const loadData = useCallback(async () => {
        if (!id) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const [unitData, professionalsData] = await Promise.all([
                adminUnitsService.getById(id),
                adminUnitsService.listProfessionals(id),
            ])

            setUnit(unitData)
            setProfessionals(professionalsData)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar unidade")
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const handleCreateProfessional = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!id) {
            return
        }

        setIsSaving(true)

        try {
            await adminUnitsService.createProfessional(id, {
                user: {
                    name: form.name,
                    email: form.email,
                    cpf: form.cpf,
                    birthdate: form.birthdate,
                    phone: form.phone,
                    password: form.password,
                },
                crm: form.crm,
            })

            setForm(initialProfessionalForm)
            setIsModalOpen(false)
            await loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao criar profissional")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-6 text-sm text-slate-500">Carregando detalhes da unidade...</div>
    }

    if (!unit) {
        return <div className="p-6 text-sm text-red-600">Unidade não encontrada.</div>
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader title={unit.name} />
            <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
                <Button variant="outline" onClick={() => navigate("/admin/unidades")} className="cursor-pointer">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar para unidades
                </Button>

                <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{unit.name}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{unit.address} - {unit.city}/{unit.state}</p>

                    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <div><span className="font-medium">CNPJ:</span> {unit.cnpj}</div>
                        <div><span className="font-medium">Telefone:</span> {unit.phone}</div>
                        <div><span className="font-medium">E-mail:</span> {unit.email}</div>
                        <div><span className="font-medium">Dono:</span> {unit.owner?.name ?? "Não definido"}</div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profissionais vinculados</h2>
                        <Button onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Novo profissional
                        </Button>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
                    ) : null}

                    <div className="mt-4 overflow-auto">
                        <table className="w-full text-sm text-slate-900 dark:text-slate-100">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                                    <th className="py-2 pr-3">Nome</th>
                                    <th className="py-2 pr-3">E-mail</th>
                                    <th className="py-2 pr-3">CRM</th>
                                    <th className="py-2 pr-3">Telefone</th>
                                    <th className="py-2 pr-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {professionals.map((professional) => (
                                    <tr key={professional.id} className="border-b border-slate-100 dark:border-slate-700">
                                        <td className="py-2 pr-3">{professional.name}</td>
                                        <td className="py-2 pr-3">{professional.email}</td>
                                        <td className="py-2 pr-3">{professional.crm ?? "-"}</td>
                                        <td className="py-2 pr-3">{professional.phone}</td>
                                        <td className="py-2 pr-3">{professional.status ? "Ativo" : "Inativo"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 bg-slate-900/50 px-4 py-8 overflow-y-auto">
                    <div className="mx-auto max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-6">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Cadastrar profissional</h3>
                        <form onSubmit={handleCreateProfessional} className="mt-4 grid gap-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Input placeholder="Nome" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                                <Input placeholder="E-mail" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                                <Input placeholder="CPF" value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} required />
                                <Input type="date" value={form.birthdate} onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))} required />
                                <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
                                <Input placeholder="CRM" value={form.crm} onChange={(e) => setForm((p) => ({ ...p, crm: e.target.value }))} required />
                            </div>
                            <Input type="password" placeholder="Senha inicial" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="cursor-pointer">Cancelar</Button>
                                <Button type="submit" disabled={isSaving} className="cursor-pointer">{isSaving ? "Salvando..." : "Cadastrar"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
