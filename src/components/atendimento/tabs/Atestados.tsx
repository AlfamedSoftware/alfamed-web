import { FileCheck2 } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function Atestados(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={FileCheck2} title="Atestados" description="A emissão de atestados médicos estará disponível em breve." />
}
