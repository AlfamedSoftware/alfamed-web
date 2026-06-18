import { ClipboardList } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function Anamnese(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={ClipboardList} title="Anamnese" description="O formulário de anamnese estará disponível em breve." />
}
