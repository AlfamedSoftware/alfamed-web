import { FlaskConical } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function ExamesLaboratoriais(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={FlaskConical} title="Exames Laboratoriais" description="A solicitação e visualização de exames laboratoriais estará disponível em breve." />
}
