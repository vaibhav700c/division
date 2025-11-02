import { type HTMLAttributes, forwardRef } from "react"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", ...props }, ref) => {
    const variants = {
      default: "bg-primary/10 text-primary",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      error: "bg-error/10 text-error",
      info: "bg-accent/10 text-accent",
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        {...props}
      />
    )
  },
)

Badge.displayName = "Badge"
