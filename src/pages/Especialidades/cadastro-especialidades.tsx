import { SpecialtyProfile } from "./Componentes/specialty-form"

interface CadastroEspecialidadesFormProps {
    showHeader?: boolean
    className?: string
    onCancel?: () => void
}

export function CadastroEspecialidadesForm({
    showHeader = true,
    className,
    onCancel,
}: CadastroEspecialidadesFormProps) {
    return (
        <div className={className}>
            <SpecialtyProfile
                isRegisterMode
                afterSavePath={showHeader ? "/especialidades" : null}
                onCancel={onCancel}
                showPageHeader={showHeader}
            />
        </div>
    )
}

export function CadastroEspecialidades() {
    return <CadastroEspecialidadesForm />
}