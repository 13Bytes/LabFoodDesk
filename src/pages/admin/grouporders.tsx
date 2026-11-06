import {
  Calendar,
  CheckCircle,
  DollarSign,
  Plus,
  Repeat,
  Users,
  XCircle
} from "lucide-react"
import React, { useState } from "react"
import GrouporderForm from "~/components/Forms/GrouporderForm"
import GrouporderTemplateForm from "~/components/Forms/GrouporderTemplateForm"
import { Pagination } from "~/components/General/Pagination"
import Modal from "~/components/Layout/Modal"
import RegularPage from "~/components/Layout/RegularPage"
import StatCard from "~/components/PageComponents/StatsCard"
import { weekdays } from "~/helper/globalTypes"
import { type Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

const GroupOrdersPage = () => {
  const allOrderTemplateRequest = api.groupOrders.getAllTemplates.useQuery()
  const {
    data: groupOrders,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = api.groupOrders.getAll.useInfiniteQuery(
    {},
    {
      placeholderData: (previousData) => previousData,
      getNextPageParam: (lastPage) => {
        if (lastPage.nextPageExists) {
          return lastPage.pageNumber + 1
        } else {
          return undefined
        }
      },
    },
  )
  const [page, setPage] = React.useState(0)
  const maxPage = hasNextPage ? Infinity : page

  const [addGrouporderModalOpen, setAddGrouporderModalOpen] = useState<Tid | boolean>(false)
  const [grouporderTemplateModalOpen, setGrouporderTemplateModalOpen] = useState<Tid | boolean>(
    false,
  )

  // Calculate statistics
  const templateCount = allOrderTemplateRequest.data?.length ?? 0
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("de", { hour: "2-digit", minute: "2-digit" })
  // next deadline over all templates (same logic as the cron job)
  const nextTemplateDeadline = (() => {
    const now = new Date()
    let next: { date: Date; name: string } | undefined
    for (const template of allOrderTemplateRequest.data ?? []) {
      const date = new Date(now)
      date.setDate(now.getDate() + ((template.weekday - now.getDay() + 7) % 7))
      date.setHours(template.ordersCloseAt.getHours(), template.ordersCloseAt.getMinutes(), 0, 0)
      if (date <= now) date.setDate(date.getDate() + 7)
      if (!next || date < next.date) next = { date, name: template.name }
    }
    return next
  })()

  const currentPageOrders = groupOrders?.pages[page]?.items ?? []
  const totalOrders = currentPageOrders.length
  const openOrders = currentPageOrders.filter((o) => o.status === 0).length
  const paidOrders = currentPageOrders.filter((o) => o.status === 5).length
  const completedOrders = currentPageOrders.filter((o) => o.status === 6).length

  const legendTemplatesRow = (
    <tr>
      <th>Termin</th>
      <th>Name</th>
      <th className="hidden md:table-cell">Kategorie</th>
      <th className="hidden md:table-cell">Anlegen</th>
      <th className="hidden text-right sm:table-cell">Aktionen</th>
    </tr>
  )

  const legendRow = (
    <tr>
      <th>Datum</th>
      <th>Name</th>
      <th className="text-center">Status</th>
      <th className="hidden md:table-cell">Bestellungen</th>
      <th className="hidden text-right sm:table-cell">Aktionen</th>
    </tr>
  )

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="badge badge-info gap-1">
            <Calendar className="h-3 w-3" />
            Offen
          </span>
        )
      case 5:
        return (
          <span className="badge badge-warning gap-1">
            <DollarSign className="h-3 w-3" />
            Bezahlt
          </span>
        )
      case 6:
        return (
          <span className="badge badge-success gap-1">
            <CheckCircle className="h-3 w-3" />
            Abgeschlossen
          </span>
        )
      case 99:
        return (
          <span className="badge badge-error gap-1">
            <XCircle className="h-3 w-3" />
            Storniert
          </span>
        )
      default:
        return <span className="badge">{status}</span>
    }
  }

  return (
    <RegularPage>
      <div className="space-y-8">
        {/* Templates Section */}
        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Repeat className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-base-content">Wiederholungen</h2>
              </div>
              <button
                className="btn btn-primary btn-sm gap-2 sm:btn-md"
                onClick={() => setGrouporderTemplateModalOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Wiederholung
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                icon={Repeat}
                title="Wiederholungen"
                value={templateCount}
                description="Werden automatisch angelegt"
                colorClass="primary"
              />

              <StatCard
                icon={Calendar}
                title="Nächste Deadline"
                value={
                  nextTemplateDeadline
                    ? `${weekdays[nextTemplateDeadline.date.getDay()]?.slice(0, 2)}, ${formatTime(nextTemplateDeadline.date)}`
                    : "–"
                }
                description={nextTemplateDeadline?.name ?? "Keine Wiederholung"}
                colorClass="info"
              />
            </div>

            {/* Loading State */}
            {allOrderTemplateRequest.isLoading && (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}

            {/* Empty State */}
            {!allOrderTemplateRequest.isLoading && templateCount === 0 && (
              <div className="py-12 text-center">
                <div className="space-y-2 text-base-content/50">
                  <Repeat className="mx-auto h-16 w-16 opacity-30" />
                  <p className="text-lg">Keine Wiederholungen vorhanden</p>
                  <p className="text-sm">Erstelle deine erste Wiederholung mit dem Button oben</p>
                </div>
              </div>
            )}

            {/* Table */}
            {!allOrderTemplateRequest.isLoading && templateCount > 0 && (
              <div className="overflow-x-auto rounded-lg border border-base-300">
                <table className="table table-zebra">
                  <thead className="bg-base-200">
                    {legendTemplatesRow}
                  </thead>
                  <tbody>
                    {allOrderTemplateRequest.data?.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer transition-colors hover:bg-base-200/50"
                        onClick={() => setGrouporderTemplateModalOpen(item.id)}
                      >
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold">{weekdays[item.weekday]}</span>
                            <span className="text-xs text-base-content/60">
                              {formatTime(item.ordersCloseAt)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="font-bold">{item.name}</div>
                        </td>
                        <td className="hidden md:table-cell">
                          {item.defaultCategory ? (
                            <span className="badge badge-outline badge-sm">{item.defaultCategory.name}</span>
                          ) : (
                            <span className="text-sm text-base-content/40">Alle</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-sm">{item.ordersStartsAt} h vorher</span>
                        </td>
                        <td className="hidden text-right sm:table-cell">
                          <button className="btn btn-ghost btn-sm hover:btn-primary">
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Group Orders Section */}
        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-base-content">Gruppen-Käufe</h2>
              </div>
              <button
                className="btn btn-primary btn-sm gap-2 sm:btn-md"
                onClick={() => setAddGrouporderModalOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Gruppenbestellung
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                icon={Calendar}
                title="Offen"
                value={openOrders}
                description="In Bestellung"
                colorClass="info"
              />

              <StatCard
                icon={DollarSign}
                title="Abrechnung ausstehen"
                value={paidOrders}
                description="Noch nicht abgeschlossen"
                colorClass="warning"
              />

              <StatCard
                icon={CheckCircle}
                title="Abgeschlossen"
                value={completedOrders}
                description="Fertig"
                colorClass="success"
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && totalOrders === 0 && (
              <div className="py-12 text-center">
                <div className="space-y-2 text-base-content/50">
                  <Users className="mx-auto h-16 w-16 opacity-30" />
                  <p className="text-lg">Keine Gruppenbestellungen vorhanden</p>
                  <p className="text-sm">
                    Erstelle deine erste Gruppenbestellung mit dem Button oben
                  </p>
                </div>
              </div>
            )}

            {/* Table */}
            {!isLoading && totalOrders > 0 && (
              <div className="overflow-x-auto rounded-lg border border-base-300">
                <table className="table table-zebra">
                  <thead className="bg-base-200">
                    {legendRow}
                  </thead>
                  <tbody>
                    {currentPageOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="cursor-pointer transition-colors hover:bg-base-200/50"
                        onClick={() => setAddGrouporderModalOpen(order.id)}
                      >
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {order.ordersCloseAt.toLocaleDateString("de", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span className="text-xs text-base-content/60">
                              {formatTime(order.ordersCloseAt)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="font-bold">{order.name}</div>
                        </td>
                        <td className="text-center">{getStatusBadge(order.status)}</td>
                        <td className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {order.orders.length > 0 ? (
                              order.orders.map((ord) => (
                                <span key={ord.id} className="badge badge-outline badge-sm">
                                  {ord.user.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-base-content/40">
                                Keine Bestellungen
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hidden text-right sm:table-cell">
                          <button className="btn btn-ghost btn-sm hover:btn-primary">
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalOrders > 0 && (
              <div className="flex justify-center">
                <Pagination page={page} maxPage={maxPage} setPage={setPage} fetchNextPage={fetchNextPage} />
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <Modal setOpen={setAddGrouporderModalOpen} open={!!addGrouporderModalOpen}>
          <GrouporderForm
            finishAction={() => {
              setAddGrouporderModalOpen(false)
            }}
            id={typeof addGrouporderModalOpen === "string" ? addGrouporderModalOpen : undefined}
          />
        </Modal>
        <Modal setOpen={setGrouporderTemplateModalOpen} open={!!grouporderTemplateModalOpen}>
          <GrouporderTemplateForm
            finishAction={() => {
              setGrouporderTemplateModalOpen(false)
            }}
            id={
              typeof grouporderTemplateModalOpen === "string"
                ? grouporderTemplateModalOpen
                : undefined
            }
          />
        </Modal>
      </div>
    </RegularPage>
  )
}

export default GroupOrdersPage
