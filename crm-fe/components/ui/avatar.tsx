import { type ImgHTMLAttributes, forwardRef } from "react"

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  initials?: string
  size?: "sm" | "md" | "lg"
}

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ size = "md", initials, className = "", ...props }, ref) => {
    const sizes = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    }

    if (props.src) {
      return <img ref={ref} className={`rounded-full object-cover ${sizes[size]} ${className}`} {...props} />
    }

    return (
      <div
        className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold ${sizes[size]} ${className}`}
      >
        {initials}
      </div>
    )
  },
)

Avatar.displayName = "Avatar"
