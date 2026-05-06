type StorageAccessDocument = Document & {
    hasStorageAccess?: () => Promise<boolean>
    requestStorageAccess?: () => Promise<void>
}

export async function ensureStorageAccessBeforeLogin() {
    if (typeof window === "undefined") {
        return { granted: true, attempted: false }
    }

    const storageDocument = document as StorageAccessDocument
    const hasStorageAccess = storageDocument.hasStorageAccess
    const requestStorageAccess = storageDocument.requestStorageAccess

    // Browsers without the API keep the current login flow.
    if (!hasStorageAccess || !requestStorageAccess) {
        return { granted: true, attempted: false }
    }

    // Safari only requires this in embedded/third-party contexts.
    if (window.top === window.self) {
        return { granted: true, attempted: false }
    }

    try {
        const alreadyGranted = await hasStorageAccess.call(storageDocument)
        if (alreadyGranted) {
            return { granted: true, attempted: false }
        }
    } catch {
        // If the check fails, try requesting access directly.
    }

    try {
        await requestStorageAccess.call(storageDocument)
        return { granted: true, attempted: true }
    } catch {
        return { granted: false, attempted: true }
    }
}