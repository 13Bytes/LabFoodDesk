import { type HTMLAttributes } from "react"
import { getUsernameLetters } from "~/helper/generalFunctions"

const sizeClasses = {
  sm: "h-10 w-10 text-lg",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-2xl",
  xl: "h-20 w-20 text-3xl",
}

const toneClasses = {
  primary: "bg-primary text-primary-content",
  soft: "bg-primary/20 text-primary",
  neutral: "bg-base-100 text-neutral-content",
}

type UserAvatarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  name?: string | null
  size?: keyof typeof sizeClasses
  tone?: keyof typeof toneClasses
  weight?: "semibold" | "bold"
}

export function UserAvatar({
  name,
  size = "md",
  tone = "primary",
  weight = "semibold",
  ...props
}: UserAvatarProps) {
  return (
    <div
      {...props}
      className={`flex shrink-0 items-center justify-center rounded-full ${sizeClasses[size]} ${toneClasses[tone]} ${props.className ?? ""}`}
    >
      <span className={`block leading-none ${weight === "bold" ? "font-bold" : "font-semibold"}`}>
        {getUsernameLetters(name)}
      </span>
    </div>
  )
}
