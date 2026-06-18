import { FileSearch } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function SolicitacaoExames(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={FileSearch} title="Solicitação de Exames" description="A solicitação de exames ao laboratório estará disponível em breve." />
}
