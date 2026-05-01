import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X } from "lucide-react"
import { professionalsService, type Professional } from "@/services/professionals.service"

interface EditProfessionalModalProps {
    open: boolean
    professional: Professional | null
    onClose: () => void
    onSaved: () => void
}

const schema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().optional(),
    crm: z.string().optional(),
    isActive: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function EditProfessionalModal({ open, professional, onClose, onSaved }: EditProfessionalModalProps) {
    const { register, handleSubmit, reset, formState } = useForm<FormValues>({ resolver: zodResolver(schema) })

    useEffect(() => {
        if (professional) {
            reset({
                name: professional.name ?? "",
                email: professional.email ?? "",
                phone: professional.phone ?? "",
                crm: professional.crm ?? "",
                isActive: professional.isActive,
            })
        }
    }, [professional, reset])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    if (!open || !professional) return null

    const onSubmit = async (data: FormValues) => {
        try {
            await professionalsService.update(professional.id, {
                name: data.name,
                email: data.email,
                isActive: data.isActive,
            })
            onSaved()
            onClose()
        } catch (err) {
            console.error(err)
            // let parent show toast
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <form onSubmit={handleSubmit(onSubmit)} className="relative w-full max-w-xl mx-4 rounded-2xl shadow-xl p-6 bg-card text-card-foreground border border-border animate-in fade-in-0 zoom-in-95">
                <button aria-label="Fechar" className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
                    <X className="w-4 h-4" />
                </button>

                <h3 className="text-lg font-semibold mb-3">Editar Profissional</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground">Nome completo</label>
                        <input {...register("name")} className="w-full rounded-md border border-border p-2 bg-background" />
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground">E-mail</label>
                        <input {...register("email")} className="w-full rounded-md border border-border p-2 bg-background" />
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground">Telefone</label>
                        <input {...register("phone")} className="w-full rounded-md border border-border p-2 bg-background" />
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground">Registro (CRM)</label>
                        <input {...register("crm")} className="w-full rounded-md border border-border p-2 bg-background" />
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-5">
                    <button type="button" className="px-4 py-2 rounded-md border border-border" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white">{formState.isSubmitting ? "Salvando..." : "Salvar alterações"}</button>
                </div>
            </form>
        </div>
    )
}

export default EditProfessionalModal
