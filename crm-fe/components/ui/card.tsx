import { type HTMLAttributes, forwardRef } from "react"

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`bg-card border border-border rounded-lg p-6 ${className}`} {...props} />
))

Card.displayName = "Card"

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => <div ref={ref} className={`mb-4 ${className}`} {...props} />,
)

CardHeader.displayName = "CardHeader"

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h2 ref={ref} className={`text-xl font-semibold text-card-foreground ${className}`} {...props} />
  ),
)

CardTitle.displayName = "CardTitle"

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => <div ref={ref} className={`text-card-foreground ${className}`} {...props} />,
)

CardContent.displayName = "CardContent"
