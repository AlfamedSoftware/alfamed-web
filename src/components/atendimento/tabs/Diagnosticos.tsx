import { Activity } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function Diagnosticos(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={Activity} title="Diagnósticos" description="O registro de diagnósticos e CID estará disponível em breve." />
}
