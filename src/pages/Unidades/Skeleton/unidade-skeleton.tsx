function FieldSkeleton() {
	return <div className="h-10 animate-pulse rounded-md bg-muted" />
}

export function UnidadeSkeleton() {
	return (
		<div>
			<div className="grid gap-5">
				<div className="grid gap-5 md:grid-cols-2">
					<div className="grid gap-2 md:col-span-2">
						<div className="h-4 w-20 animate-pulse rounded bg-muted" />
						<FieldSkeleton />
					</div>

					<div className="grid gap-2">
						<div className="h-4 w-12 animate-pulse rounded bg-muted" />
						<FieldSkeleton />
					</div>

					<div className="grid gap-2">
						<div className="h-4 w-16 animate-pulse rounded bg-muted" />
						<FieldSkeleton />
					</div>

					<div className="grid gap-2 md:col-span-2">
						<div className="h-4 w-24 animate-pulse rounded bg-muted" />
						<FieldSkeleton />
					</div>

					<div className="grid gap-2">
						<div className="h-4 w-16 animate-pulse rounded bg-muted" />
						<div className="h-10 animate-pulse rounded-md bg-muted" />
					</div>

					<div className="grid gap-2">
						<div className="h-4 w-16 animate-pulse rounded bg-muted" />
						<FieldSkeleton />
					</div>

					<div className="grid gap-2 md:col-span-2">
						<div className="h-4 w-16 animate-pulse rounded bg-muted" />
						<FieldSkeleton />
					</div>
				</div>

				<div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="" />
					<div className="flex flex-col items-start gap-2 sm:items-end">
						<div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
					</div>
				</div>
			</div>
		</div>
	)
}