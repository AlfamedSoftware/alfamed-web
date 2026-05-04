import { authBaseUrl } from "@/lib/auth"

interface ProfessionalUnitRolesResponse {
    roles?: Array<string | { key?: string; name?: string }>
    data?: Array<string | { key?: string; name?: string }>
}

function parseRolesResponse(payload: unknown): string[] {
    const extractRoleKeys = (roles: unknown[]) =>
        roles.flatMap((role) => {
            if (typeof role === "string" && role.length > 0) {
                return [role]
            }

            if (role && typeof role === "object") {
                const roleObject = role as { key?: unknown }
                const roleKey = typeof roleObject.key === "string" && roleObject.key.length > 0 ? roleObject.key : null

                if (roleKey) {
                    return [roleKey]
                }
            }

            return []
        })

    if (Array.isArray(payload)) {
        return extractRoleKeys(payload)
    }

    if (payload && typeof payload === "object") {
        const response = payload as ProfessionalUnitRolesResponse

        if (Array.isArray(response.roles)) {
            return extractRoleKeys(response.roles)
        }

        if (Array.isArray(response.data)) {
            return extractRoleKeys(response.data)
        }
    }

    return []
}

export interface ListProfessionalUnitRolesInput {
    requestUserId: string
    unitId: string
    professionalUnitId: string
}

export async function listProfessionalUnitRoles({
    requestUserId,
    unitId,
    professionalUnitId,
}: ListProfessionalUnitRolesInput): Promise<string[]> {
    const url = new URL(`${authBaseUrl}/professionals/professional-unit/roles`)
    url.searchParams.set("requestUserId", requestUserId)
    url.searchParams.set("unitId", unitId)
    url.searchParams.set("professionalUnitId", professionalUnitId)

    if (import.meta.env.DEV) {
        console.debug("[professional-unit-roles] request", {
            url: url.toString(),
            requestUserId,
            unitId,
            professionalUnitId,
        })
    }

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
    })

    if (import.meta.env.DEV) {
        console.debug("[professional-unit-roles] response", {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
        })
    }

    if (!response.ok) {
        if (import.meta.env.DEV) {
            console.debug("[professional-unit-roles] non-ok response, returning empty roles")
        }

        return []
    }

    const payload = await response.json().catch(() => null)
    const roles = parseRolesResponse(payload)

    if (import.meta.env.DEV) {
        console.debug("[professional-unit-roles] payload", payload)
        console.debug("[professional-unit-roles] parsed roles", roles)
    }

    return roles
}