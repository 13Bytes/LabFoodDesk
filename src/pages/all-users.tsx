import { Search, Users, X } from "lucide-react"
import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { UserAvatar } from "~/components/General/UserAvatar"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })

const AllUsersPage: NextPage = () => {
  const allBalancesRequest = api.user.getAllBalances.useQuery()
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("name")
  const users = allBalancesRequest.data ?? []
  const filteredUsers = users
    .filter((user) =>
      (user.name ?? "").toLocaleLowerCase("de").includes(search.trim().toLocaleLowerCase("de")),
    )
    .sort((a, b) => {
      const byName = (a.name ?? "").localeCompare(b.name ?? "", "de")
      if (sort === "balance-desc") return b.balance - a.balance || byName
      if (sort === "balance-asc") return a.balance - b.balance || byName
      return byName
    })

  return (
    <CenteredPage>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        <header className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <Users aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base-content text-2xl font-bold sm:text-3xl">
              Guthaben aller Nutzer
            </h1>
            <p className="text-base-content/60 mt-1 text-sm">Alle Kontostände auf einen Blick.</p>
          </div>
        </header>

        <section
          aria-label="Nutzerübersicht"
          className="border-base-300 bg-base-200 overflow-hidden rounded-2xl border shadow-sm"
        >
          <div className="border-base-300 flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
            <label className="input input-bordered flex w-full min-w-0 items-center gap-2 sm:flex-1">
              <Search aria-hidden="true" className="text-base-content/50 h-4 w-4 shrink-0" />
              <input
                type="search"
                aria-label="Nutzer suchen"
                placeholder="Nutzer suchen …"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 grow"
              />
            </label>
            <select
              aria-label="Nutzer sortieren"
              className="select select-bordered w-full sm:w-56"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="name">Name: A–Z</option>
              <option value="balance-desc">Höchstes Guthaben zuerst</option>
              <option value="balance-asc">Niedrigstes Guthaben zuerst</option>
            </select>
          </div>

          {allBalancesRequest.isLoading ? (
            <div role="status" className="space-y-5 p-4">
              <span className="sr-only">Guthaben werden geladen …</span>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} aria-hidden="true" className="flex items-center gap-3">
                  <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                  <div className="skeleton h-4 w-2/5" />
                  <div className="skeleton ml-auto h-5 w-20" />
                </div>
              ))}
            </div>
          ) : allBalancesRequest.isError ? (
            <div role="alert" className="space-y-3 px-4 py-10 text-center">
              <p className="text-base-content/70">Die Guthaben konnten nicht geladen werden.</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => void allBalancesRequest.refetch()}
              >
                Erneut versuchen
              </button>
            </div>
          ) : users.length === 0 ? (
            <p className="text-base-content/60 px-4 py-12 text-center">
              Noch keine Nutzer vorhanden.
            </p>
          ) : filteredUsers.length === 0 ? (
            <div className="space-y-3 px-4 py-10 text-center">
              <p className="text-base-content/70">Keine Nutzer für „{search.trim()}“ gefunden.</p>
              <button className="btn btn-ghost btn-sm gap-2" onClick={() => setSearch("")}>
                <X aria-hidden="true" className="h-4 w-4" />
                Suche zurücksetzen
              </button>
            </div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <caption className="sr-only">Kontostände aller Nutzer</caption>
              <thead className="text-base-content/60 text-xs">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Nutzer
                  </th>
                  <th scope="col" className="w-28 px-4 py-3 text-right font-medium sm:w-40">
                    Guthaben
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.id === session?.user.id
                  return (
                    <tr
                      key={user.id}
                      className={`border-base-300 hover:bg-base-300/40 border-t transition-colors ${isCurrentUser ? "bg-primary/5" : ""}`}
                    >
                      <th scope="row" className="px-4 py-4 text-left font-medium">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            aria-hidden="true"
                            name={user.name}
                            size="sm"
                            tone="soft"
                            className="hidden sm:flex"
                          />
                          <div className="min-w-0 [overflow-wrap:anywhere]">
                            {user.name ?? "Unbekannter Nutzer"}
                            {isCurrentUser && (
                              <span className="text-primary ml-2 inline-block text-xs font-normal">
                                Du
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                      <td
                        className={`px-4 py-4 text-right font-semibold whitespace-nowrap tabular-nums ${user.balance < 0 ? "text-error" : user.balance > 0 ? "text-success" : "text-base-content/60"}`}
                      >
                        {currency.format(user.balance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {allBalancesRequest.isSuccess && users.length > 0 && (
            <p
              role="status"
              className="border-base-300 text-base-content/60 border-t px-4 py-3 text-xs"
            >
              {filteredUsers.length} von {users.length} Nutzern
            </p>
          )}
        </section>
      </div>
    </CenteredPage>
  )
}

export default AllUsersPage
