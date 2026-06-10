import type { AttendanceSpecialty } from "@/services/attendance.service"
import { cn } from "@/lib/utils"

type SpecialtyFilterProps = {
    specialties: AttendanceSpecialty[]
    activeSpecialtyId: string | null
    onSelect: (specialtyId: string) => void
}

export function SpecialtyFilter({ specialties, activeSpecialtyId, onSelect }: SpecialtyFilterProps) {
    if (specialties.length <= 1) {
        return null
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Especialidades">
            {specialties.map((specialty) => (
                <button
                    key={specialty.id}
                    type="button"
                    onClick={() => onSelect(specialty.id)}
                    className={cn(
                        "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition",
                        activeSpecialtyId === specialty.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                >
                    {specialty.name}
                </button>
            ))}
        </div>
    )
}
