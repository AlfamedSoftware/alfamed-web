import { ProfessionalProfile } from "./edicao-profissionais"
import { useSearchParams } from "react-router"

interface CadastroProfissionaisFormProps {
    onCreated?: () => void
    showHeader?: boolean
    className?: string
    onCancel?: () => void
    initialCpf?: string
}

export function CadastroProfissionaisForm({
    onCreated,
    showHeader = true,
    className,
    onCancel,
    initialCpf,
}: CadastroProfissionaisFormProps) {
    return (
        <div className={className}>
            <ProfessionalProfile
                isRegisterMode
                afterSavePath={showHeader ? "/profissionais" : null}
                onCreated={onCreated}
                showPageHeader={showHeader}
                onCancel={onCancel}
                initialCpf={initialCpf}
            />
        </div>
    )
}

export function CadastroProfissionais() {
    const [searchParams] = useSearchParams()
    return <CadastroProfissionaisForm initialCpf={searchParams.get("cpf") ?? undefined} />
}
