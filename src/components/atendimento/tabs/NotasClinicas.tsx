import { NotebookPen } from "lucide-react"

type TabProps = {
    scheduleId: string
    patientId: string
}

export function NotasClinicas(_: TabProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <NotebookPen className="size-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">Notas clínicas</p>
                <p className="mt-1 text-xs text-muted-foreground">O registro de notas clínicas estará disponível em breve.</p>
            </div>
        </div>
    )
}
