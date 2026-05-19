import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "./input"

type PasswordInputProps = React.ComponentProps<typeof Input>

export function PasswordInput({ className, ...props }: PasswordInputProps) {
    const [visible, setVisible] = React.useState(false)

    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? "text" : "password"}
                className={["pr-9", className].filter(Boolean).join(" ")}
            />

            <button
                type="button"
                aria-label={visible ? "Esconder senha" : "Mostrar senha"}
                onClick={() => setVisible((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
            >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    )
}

export default PasswordInput
