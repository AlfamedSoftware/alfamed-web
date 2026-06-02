import { SpecialtyProfile } from "./Componentes/specialty-form"

interface EdicaoEspecialidadesFormProps {
    showHeader?: boolean
    className?: string
    onCancel?: () => void
}

export function EdicaoEspecialidadesForm({ showHeader = true, className, onCancel }: EdicaoEspecialidadesFormProps) {
    return (
        <div className={className}>
            <SpecialtyProfile
                afterSavePath={showHeader ? "/especialidades" : null}
                onCancel={onCancel}
                showPageHeader={showHeader}
            />
        </div>
    )
}

export function EdicaoEspecialidades() {
    return <EdicaoEspecialidadesForm />
}