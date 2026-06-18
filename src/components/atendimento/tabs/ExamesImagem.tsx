import { ScanLine } from "lucide-react"
import { TabPlaceholder } from "./TabPlaceholder"

export function ExamesImagem(_: { scheduleId: string; patientId: string }) {
    return <TabPlaceholder icon={ScanLine} title="Exames de Imagem" description="A visualização de laudos e exames de imagem estará disponível em breve." />
}
