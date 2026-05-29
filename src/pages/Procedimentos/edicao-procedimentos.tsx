import { ProcedureProfile } from "./Componentes/procedure-form"

interface EdicaoProcedimentosFormProps {
    showHeader?: boolean
    className?: string
    onCancel?: () => void
}

export function EdicaoProcedimentosForm({ showHeader = true, className, onCancel }: EdicaoProcedimentosFormProps) {
    return (
        <div className={className}>
            <ProcedureProfile
                afterSavePath={showHeader ? "/procedimentos" : null}
                onCancel={onCancel}
                showPageHeader={showHeader}
            />
        </div>
    )
}

export function EdicaoProcedimentos() {
    return <EdicaoProcedimentosForm />
}