import { LucideIcon } from "lucide-react"

export interface StatCardProps {
    icon: LucideIcon
    title: string
    value: string | number
    description: string
    colorClass?: string
}

const StatCard = ({ icon: Icon, title, value, description, colorClass = "primary" }: StatCardProps) => (
    <div className="stat rounded-box bg-base-200 shadow-sm">
        <div className={`stat-figure text-${colorClass}`}>
            <Icon className="inline-block h-8 w-8 stroke-current" />
        </div>
        <div className="stat-title">{title}</div>
        <div className={`stat-value text-${colorClass}`}>{value}</div>
        <div className="stat-desc">{description}</div>
    </div>
)

export default StatCard