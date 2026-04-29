import { useState } from "react"
import { useForm } from "react-hook-form"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Professional } from "@/services/professionals.service"

interface CreateProfessionalModalProps {
    open: boolean
    onClose: () => void
    onSave: (data: { userId?: string; isActive: boolean }) => Promise<void>
    professional?: Professional | null
}

interface FormValues {
    userId: string
    isActive: boolean
}

export function CreateProfessionalModal({
    open,
    onClose,
    onSave,
    professional,
}: CreateProfessionalModalProps) {
    const isEditing = !!professional
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            userId: professional?.userId ?? "",
            isActive: professional?.isActive ?? true,
        },
        values: {
            userId: professional?.userId ?? "",
            isActive: professional?.isActive ?? true,
        },
    })

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true)
        try {
            if (isEditing) {
                await onSave({ isActive: data.isActive })
            } else {
                await onSave({ userId: data.userId || undefined, isActive: data.isActive })
            }
            reset()
            onClose()
        } catch {
            void 0
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-popover">
                    <SheetTitle className="text-lg font-semibold text-foreground">
                        {isEditing ? "Editar Profissional" : "Novo Profissional"}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        {isEditing
                            ? "Atualize as informações do profissional."
                            : "Preencha os dados para cadastrar um novo profissional."}
                    </SheetDescription>
                </SheetHeader>

                <form
                    id="professional-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
                >
                    {!isEditing && (
                        <div className="space-y-1.5">
                            <Label htmlFor="field-userId" className="text-sm font-medium text-foreground">
                                ID do Usuário
                            </Label>
                            <Input
                                id="field-userId"
                                placeholder="UUID do usuário vinculado"
                                {...register("userId")}
                                className="text-sm"
                            />
                            {errors.userId && (
                                <p className="text-xs text-red-500">{errors.userId.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Deixe em branco para usar o usuário atual.
                            </p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">Status</Label>
                        <div className="flex items-center gap-3 mt-1">
                            <label
                                htmlFor="toggle-isActive"
                                className="relative inline-flex items-center cursor-pointer"
                            >
                                <input
                                    id="toggle-isActive"
                                    type="checkbox"
                                    className="sr-only peer"
                                    {...register("isActive")}
                                    defaultChecked={professional?.isActive ?? true}
                                />
                                <div className="w-11 h-6 bg-popover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                                <span className="ml-3 text-sm text-muted-foreground">Ativo</span>
                            </label>
                        </div>
                    </div>
                </form>

                <SheetFooter className="px-6 py-4 border-t bg-popover flex gap-2 border-border">
                    <Button
                        id="cancel-professional-modal"
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        id="save-professional-modal"
                        type="submit"
                        form="professional-form"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting
                            ? "Salvando..."
                            : isEditing
                                ? "Salvar alterações"
                                : "Cadastrar"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
