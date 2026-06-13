import { Building2, User } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/hooks/use-session"
import { useSessionUnit } from "@/contexts/session-unit-context"
import loginLogo from "@/assets/auth/login.svg"

export function Home() {
    const { user, isLoading: isUserLoading } = useSession()
    const { sessionUnit, isLoading: isSessionUnitLoading } = useSessionUnit()
    const isLoading = isUserLoading || isSessionUnitLoading

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Início" />

            <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
                <div className="flex h-full w-full flex-col justify-between gap-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col items-center gap-8 text-center">
                        <div>
                            <h1 className="text-4xl font-bold text-primary">
                                Bem-vindo ao Alfamed{user?.name ? `, ${user.name}` : ""}
                            </h1>
                            <p className="mt-3 text-lg text-muted-foreground">
                                Sistema de gestão para clínicas e consultórios médicos
                            </p>
                        </div>
                    </div>

                    {/* Logo Image */}
                    <div className="flex justify-center">
                        <img
                            src={loginLogo}
                            alt="Alfamed Logo"
                            className="h-auto max-w-lg object-contain"
                        />
                    </div>

                    {/* User Info Section */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">Unidade Atual</h3>
                                {isLoading ? (
                                    <Skeleton variant="text" size="md" className="mt-1 w-32" />
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {sessionUnit?.selectedUnitName || "Não selecionada"}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">Cargo Atual</h3>
                                {isLoading ? (
                                    <Skeleton variant="text" size="md" className="mt-1 w-24" />
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {sessionUnit?.selectedRoles?.description || "Não definido"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
