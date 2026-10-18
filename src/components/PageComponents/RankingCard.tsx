import { type LucideIcon } from "lucide-react"

export interface RankingEntry {
  name: string
  count: number
  averagePerWeek: number
}

const RankingCard = (props: {
  icon: LucideIcon
  title: string
  entries: RankingEntry[]
  emptyText: string
  className?: string
}) => (
  <div className={`stat rounded-box bg-base-200 shadow-sm ${props.className ?? ""}`}>
    <div className="stat-figure text-primary">
      <props.icon className="inline-block h-8 w-8 stroke-current" />
    </div>
    <div className="stat-title">{props.title}</div>
    {props.entries.length === 0 && <div className="stat-desc">{props.emptyText}</div>}
    <ol className="mt-1 space-y-1">
      {props.entries.map((entry, index) => (
        <li key={entry.name} className="flex justify-between gap-4">
          <span className="font-medium">
            {index + 1}. {entry.name}
          </span>
          <span className="text-base-content/70">
            {entry.count}× · Ø {entry.averagePerWeek.toFixed(1)} / Woche
          </span>
        </li>
      ))}
    </ol>
  </div>
)

export default RankingCard
