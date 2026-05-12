import { cn } from "@/lib/utils"

type Variant = "rect" | "text"
type Size = "sm" | "md" | "lg"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: Variant
  size?: Size
}

function Skeleton({ variant = "rect", size = "md", className, ...props }: SkeletonProps) {
  const base = "bg-accent animate-pulse"

  const variantClasses =
    variant === "text"
      ? "rounded-full"
      : "rounded-md"

  const sizeClasses =
    variant === "text"
      ? size === "sm"
        ? "h-3"
        : size === "lg"
        ? "h-6"
        : "h-4"
      : size === "sm"
      ? "h-6"
      : size === "lg"
      ? "h-12"
      : "h-8"

  return (
    <div
      data-slot="skeleton"
      className={cn(base, variantClasses, sizeClasses, className)}
      {...props}
    />
  )
}

export { Skeleton }
