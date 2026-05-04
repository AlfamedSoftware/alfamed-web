import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "alfamed-theme"

function getStoredTheme(): Theme {
    if (typeof window === "undefined") return "light"
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === "light" || stored === "dark") return stored
    // fallback to system preference when not stored
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark"
    return "light"
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
}

type ThemeContextValue = {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

    useEffect(() => {
        applyTheme(theme)
        localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === "light" ? "dark" : "light"))
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}
