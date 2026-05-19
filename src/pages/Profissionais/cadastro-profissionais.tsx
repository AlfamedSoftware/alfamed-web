import { ProfessionalProfile } from "./edicao-profissionais"

interface CadastroProfissionaisFormProps {
    onCreated?: () => void
    showHeader?: boolean
    className?: string
    onCancel?: () => void
}

export function CadastroProfissionaisForm({
    onCreated,
    showHeader = true,
    className,
    onCancel,
}: CadastroProfissionaisFormProps) {
    return (
        <div className={className}>
            <ProfessionalProfile
                isRegisterMode
                afterSavePath={showHeader ? "/profissionais" : null}
                onCreated={onCreated}
                showPageHeader={showHeader}
                onCancel={onCancel}
            />
        </div>
    )
}

export function CadastroProfissionais() {
    return <CadastroProfissionaisForm />
}
