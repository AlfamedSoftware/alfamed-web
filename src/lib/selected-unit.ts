export interface SelectedUnit {
    id: string
    name: string
}

function storageKeyForUser(userId: string) {
    return `alfamed:selected-unit:${userId}`
}

export function getSelectedUnit(userId: string): SelectedUnit | null {
    try {
        const raw = localStorage.getItem(storageKeyForUser(userId))
        if (!raw) return null

        const parsed = JSON.parse(raw) as Partial<SelectedUnit>
        if (typeof parsed.id === "string" && typeof parsed.name === "string") {
            return { id: parsed.id, name: parsed.name }
        }

        return null
    } catch {
        return null
    }
}

export function setSelectedUnit(userId: string, unit: SelectedUnit) {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(unit))
}
