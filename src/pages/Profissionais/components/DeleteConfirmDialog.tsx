import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { Professional } from "@/services/professionals.service"

interface DeleteConfirmDialogProps {
    professional: Professional | null
    isOpen: boolean
    isDeleting: boolean
    onConfirm: () => Promise<void>
    onCancel: () => void
}

export function DeleteConfirmDialog({
    professional,
    isOpen,
    isDeleting,
    onConfirm,
    onCancel,
}: DeleteConfirmDialogProps) {
    if (!isOpen || !professional) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-in fade-in-0 zoom-in-95 duration-200 bg-card text-card-foreground border border-border">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Remover Profissional</h3>
                        <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mb-5">
                    Tem certeza que deseja remover este profissional? Todos os dados vinculados a ele
                    serão perdidos permanentemente.
                </p>

                <div className="flex gap-2">
                    <Button
                        id="cancel-delete"
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        id="confirm-delete"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? "Removendo..." : "Remover"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
