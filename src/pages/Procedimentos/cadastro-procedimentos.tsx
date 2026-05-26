import { ProcedureProfile } from "./Componentes/procedure-form"

interface CadastroProcedimentosFormProps {
    showHeader?: boolean
    className?: string
    onCancel?: () => void
}

export function CadastroProcedimentosForm({
    showHeader = true,
    className,
    onCancel,
}: CadastroProcedimentosFormProps) {
    return (
        <div className={className}>
            <ProcedureProfile
                isRegisterMode
                afterSavePath={showHeader ? "/procedimentos" : null}
                onCancel={onCancel}
                showPageHeader={showHeader}
            />
        </div>
    )
}

export function CadastroProcedimentos() {
    return <CadastroProcedimentosForm />
}