import { useEffect, useMemo, useState, useRef } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { SaveButton } from "@/components/ui/buttons"
import { CheckCircle2 } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import { UnidadeSkeleton } from "@/pages/Unidades/Skeleton/unidade-skeleton"

const unitFormSchema = z.object({
	name: z.string().min(1, "Informe o nome da unidade"),
	cnpj: z.string().min(1, "Informe o CNPJ"),
	address: z.string().min(1, "Informe o endereço"),
	city: z.string().min(1, "Informe a cidade"),
	state: z.string().min(1, "Selecione o estado"),
	phone: z.string().min(1, "Informe o telefone"),
	email: z.string().email("Informe um e-mail válido"),
})

type UnitFormValues = z.infer<typeof unitFormSchema>

type UnitDetailsResponse = {
	id?: string
	name?: string
	cnpj?: string | null
	address?: string | null
	city?: string | null
	state?: string | null
	phone?: string | null
	email?: string | null
}

type UpdateUnitPayload = {
	name: string
	cnpj?: string
	address?: string
	city?: string
	state?: string
	phone?: string
	email?: string
}

const brazilianStates = [
	"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
	"MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
	"RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

function normalizeOptionalValue(value?: string | null) {
	const trimmed = value?.trim() ?? ""
	return trimmed.length > 0 ? trimmed : ""
}

export function Unidade() {
	const { sessionUnit, isLoading: isSessionUnitLoading } = useSessionUnit()
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const unitId = sessionUnit?.selectedUnitId ?? ""

	const form = useForm<UnitFormValues>({
		resolver: zodResolver(unitFormSchema) as Resolver<UnitFormValues>,
		defaultValues: {
			name: "",
			cnpj: "",
			address: "",
			city: "",
			state: "",
			phone: "",
			email: "",
		},
	})

	const pageTitle = useMemo(() => "Unidade", [])

	useEffect(() => {
		if (isSessionUnitLoading) {
			return
		}

		if (!unitId) {
			setLoadError("Nenhuma unidade selecionada na sessão.")
			setIsLoading(false)
			return
		}

		const controller = new AbortController()
		let alive = true

		async function loadUnit() {
			setIsLoading(true)
			setLoadError(null)

			try {
				const data = await fetchWithAuth<UnitDetailsResponse>(`${authBaseUrl}/units/${unitId}`, {
					signal: controller.signal,
				})

				if (!alive) return

				form.reset({
					name: data.name ?? "",
					cnpj: normalizeOptionalValue(data.cnpj),
					address: normalizeOptionalValue(data.address),
					city: normalizeOptionalValue(data.city),
					state: normalizeOptionalValue(data.state),
					phone: normalizeOptionalValue(data.phone),
					email: normalizeOptionalValue(data.email),
				})
			} catch (error) {
				if ((error as Error).name === "AbortError" || !alive) {
					return
				}

				setLoadError(error instanceof Error ? error.message : "Falha ao carregar unidade")
			} finally {
				if (alive) {
					setIsLoading(false)
				}
			}
		}

		void loadUnit()

		return () => {
			alive = false
			controller.abort()
		}
	}, [form, isSessionUnitLoading, unitId])

	const onSubmit = async (values: UnitFormValues) => {
		if (!unitId) {
			setSaveError("Nenhuma unidade selecionada na sessão.")
			return
		}

		setIsSaving(true)
		setSaveError(null)
		setSaveSuccess(false)

		const payload: UpdateUnitPayload = {
			name: values.name.trim(),
			cnpj: values.cnpj?.trim() || undefined,
			address: values.address?.trim() || undefined,
			city: values.city?.trim() || undefined,
			state: values.state?.trim() || undefined,
			phone: values.phone?.trim() || undefined,
			email: values.email?.trim() || undefined,
		}

		try {
			await fetchWithAuth<void>(`${authBaseUrl}/units/${unitId}`, {
				method: "PATCH",
				body: JSON.stringify(payload),
			})
			setSaveSuccess(true)
			if (successTimerRef.current) clearTimeout(successTimerRef.current)
			successTimerRef.current = setTimeout(() => setSaveSuccess(false), 5000)
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Erro ao editar unidade")
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<PageHeader title={pageTitle} />
			{saveSuccess && (
				<div className="flex items-center gap-3 bg-green-600 px-6 py-3 text-white text-sm font-medium">
					<CheckCircle2 className="h-4 w-4 shrink-0" />
					Unidade atualizada com sucesso.
				</div>
			)}

			<main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8">
				{isSessionUnitLoading || isLoading ? (
					<UnidadeSkeleton />
				) : (
					<div className="flex flex-col flex-1 gap-5">
						{loadError ? (
							<div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{loadError}
							</div>
						) : null}

						<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 gap-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="grid gap-2 md:col-span-2">
                                <span className="text-sm font-medium">Nome</span>
                                <Input placeholder="Informe o nome da unidade" {...form.register("name")} />
                                {form.formState.errors.name ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>
                                ) : null}
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium">CNPJ</span>
                                <Input placeholder="00.000.000/0000-00" {...form.register("cnpj")} />
                                {form.formState.errors.cnpj ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.cnpj.message}</span>
                                ) : null}
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium">Telefone</span>
                                <Input placeholder="(11) 99999-9999" {...form.register("phone")} />
                                {form.formState.errors.phone ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.phone.message}</span>
                                ) : null}
                            </label>

                            <label className="grid gap-2 md:col-span-2">
                                <span className="text-sm font-medium">Endereço</span>
                                <Input placeholder="Rua, número, complemento" {...form.register("address")} />
                                {form.formState.errors.address ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.address.message}</span>
                                ) : null}
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium">Estado</span>
                                <select
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    {...form.register("state")}
                                >
                                    <option value="">Selecione</option>
                                    {brazilianStates.map((state) => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                                {form.formState.errors.state ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.state.message}</span>
                                ) : null}
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium">Cidade</span>
                                <Input placeholder="Cidade" {...form.register("city")} />
                                {form.formState.errors.city ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.city.message}</span>
                                ) : null}
                            </label>

                            <label className="grid gap-2 md:col-span-2">
                                <span className="text-sm font-medium">E-mail</span>
                                <Input type="email" placeholder="contato@unidade.com.br" {...form.register("email")} />
                                {form.formState.errors.email ? (
                                    <span className="text-xs text-destructive">{form.formState.errors.email.message}</span>
                                ) : null}
                            </label>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground"></p>
							<div className="flex flex-col items-start gap-2 sm:items-end">
								<SaveButton isSaving={isSaving} disabled={isLoading} />
								{saveError ? (
									<p className="text-sm font-medium text-destructive">{saveError}</p>
								) : null}
							</div>
                        </div>
						</form>
					</div>
				)}
			</main>
		</div>
	)
}