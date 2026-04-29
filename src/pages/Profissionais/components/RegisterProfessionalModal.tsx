import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { CadastroProfissionaisForm } from "../Cadastro/cadastro-profissionais"

interface RegisterProfessionalModalProps {
    open: boolean
    onClose: () => void
    onCreated?: () => void
}

export function RegisterProfessionalModal({
    open,
    onClose,
    onCreated,
}: RegisterProfessionalModalProps) {
    const handleCreated = () => {
        onCreated?.()
        onClose()
    }

    return (
        <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[1120px] p-0 overflow-hidden flex flex-col"
            >
                <SheetHeader className="px-8 pt-7 pb-5 border-b bg-popover border-border">
                    <SheetTitle className="text-foreground">Novo profissional</SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        Preencha os dados do usuário para concluir o cadastro de profissionais.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-7 bg-background">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <CadastroProfissionaisForm onCreated={handleCreated} showHeader={false} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
