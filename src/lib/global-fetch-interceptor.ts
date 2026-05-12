// Store the original fetch function
const originalFetch = window.fetch

// Override global fetch to intercept 401 responses
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init)

    // Check for 401 Unauthorized
    if (response.status === 401) {
        // Only redirect if it's not already a login/auth-related request
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
        const isAuthRequest = url.includes("/login") || url.includes("/signin") || url.includes("/auth")

        if (!isAuthRequest) {
            // Redirect to login
            window.location.href = "/login"
        }

        return response
    }

    return response
}
