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
  <div className={`rounded-box bg-base-200 min-w-0 p-5 shadow-sm sm:p-6 ${props.className ?? ""}`}>
    <div className="mb-4 flex items-center gap-3">
      <props.icon aria-hidden="true" className="text-primary h-5 w-5 shrink-0" />
      <h2 className="text-base-content/70 min-w-0 font-medium">{props.title}</h2>
    </div>
    {props.entries.length === 0 ? (
      <p className="text-base-content/70 text-sm">{props.emptyText}</p>
    ) : (
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">{props.title}</caption>
        <thead className="text-base-content/60 text-xs">
          <tr>
            <th scope="col" className="pr-3 pb-3 text-left font-medium">
              Artikel
            </th>
            <th scope="col" className="w-16 pr-4 pb-3 text-right font-medium sm:w-20">
              Anzahl
            </th>
            <th
              scope="col"
              className="border-base-content/10 w-24 border-l pb-3 pl-4 text-right font-medium sm:w-28"
            >
              Ø / Woche
            </th>
          </tr>
        </thead>
        <tbody>
          {props.entries.map((entry, index) => (
            <tr key={entry.name} className="border-base-content/10 border-t">
              <th
                scope="row"
                className="py-3 pr-3 text-left align-top font-medium wrap-anywhere"
              >
                <span className="text-base-content/50 mr-2">{index + 1}.</span>
                {entry.name}
              </th>
              <td className="py-3 pr-4 text-right align-top tabular-nums">{entry.count}</td>
              <td className="border-base-content/10 text-base-content/70 border-l py-3 pl-4 text-right align-top tabular-nums">
                {entry.averagePerWeek.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)

export default RankingCard
