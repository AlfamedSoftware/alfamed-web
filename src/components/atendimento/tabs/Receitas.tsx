import { Pill } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function Receitas(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={Pill} title="Receitas" description="A emissão de receitas e prescrições estará disponível em breve." />
}
