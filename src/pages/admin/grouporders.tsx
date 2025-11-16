import React, { useEffect, useState } from "react"
import {
  Plus,
  Users,
  Repeat,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react"
import GrouporderForm from "~/components/Forms/GrouporderForm"
import GrouporderTemplateForm from "~/components/Forms/GrouporderTemplateForm"
import Modal from "~/components/Layout/Modal"
import RegularPage from "~/components/Layout/RegularPage"
import { localStringOptions, weekdays } from "~/helper/globalTypes"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import StatCard from "~/components/PageComponents/StatsCard"

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
      keepPreviousData: true,
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
  const [maxPage, setMaxPage] = React.useState(Infinity)
  useEffect(() => {
    if (!hasNextPage) {
      setMaxPage(page)
    } else {
      setMaxPage(Infinity)
    }
  }, [setMaxPage, hasNextPage, page])

  const [addGrouporderModalOpen, setAddGrouporderModalOpen] = useState<Tid | boolean>(false)
  const [grouporderTemplateModalOpen, setGrouporderTemplateModalOpen] = useState<Tid | boolean>(
    false,
  )

  // Calculate statistics
  const templateCount = allOrderTemplateRequest.data?.length ?? 0
  const activeTemplates = allOrderTemplateRequest.data?.filter((t) => t.active).length ?? 0

  const currentPageOrders = groupOrders?.pages[page]?.items ?? []
  const totalOrders = currentPageOrders.length
  const openOrders = currentPageOrders.filter((o) => o.status === 0).length
  const paidOrders = currentPageOrders.filter((o) => o.status === 5).length
  const completedOrders = currentPageOrders.filter((o) => o.status === 6).length

  const LegendTemplates = () => (
    <tr>
      <th className="w-12"></th>
      <th>Name</th>
      <th>Wochentag</th>
      <th className="text-center">Status</th>
      <th className="text-right">Aktionen</th>
    </tr>
  )

  const Legend = () => (
    <tr>
      <th>Datum</th>
      <th>Name</th>
      <th className="text-center">Status</th>
      <th>Bestellungen</th>
      <th className="text-right">Aktionen</th>
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
          <div className="card-body p-6">
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
                title="Wiederholungen gesamt"
                value={templateCount}
                description="Konfigurierte Templates"
                colorClass="primary"
              />

              <StatCard
                icon={CheckCircle}
                title="Aktiv"
                value={activeTemplates}
                description="Aktive Templates"
                colorClass="success"
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
                    <LegendTemplates />
                  </thead>
                  <tbody>
                    {allOrderTemplateRequest.data?.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-base-200/50">
                        <td>
                          {item.active ? (
                            <span className="badge badge-success gap-1">
                              <CheckCircle className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="badge badge-ghost gap-1">
                              <XCircle className="h-3 w-3" />
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="font-bold">{item.name}</div>
                        </td>
                        <td>
                          <span className="badge badge-outline">{weekdays[item.weekday]}</span>
                        </td>
                        <td className="text-center">
                          {item.active ? (
                            <span className="font-semibold text-success">Aktiv</span>
                          ) : (
                            <span className="text-base-content/40">Inaktiv</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-sm hover:btn-primary"
                            onClick={() => setGrouporderTemplateModalOpen(item.id)}
                          >
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
          <div className="card-body p-6">
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
                    <Legend />
                  </thead>
                  <tbody>
                    {currentPageOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-base-200/50">
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {order.ordersCloseAt.toLocaleDateString("de", localStringOptions)}
                            </span>
                            <span className="text-xs text-base-content/60">
                              {order.ordersCloseAt.toLocaleTimeString("de", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="font-bold">{order.name}</div>
                        </td>
                        <td className="text-center">{getStatusBadge(order.status)}</td>
                        <td>
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
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-sm hover:btn-primary"
                            onClick={() => setAddGrouporderModalOpen(order.id)}
                          >
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
              <div className="mt-6 flex justify-center">
                <div className="join">
                  <button
                    className={`btn join-item ${page < 1 ? "btn-disabled" : ""}`}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    «
                  </button>
                  <button className="btn join-item pointer-events-none">Seite {page + 1}</button>
                  <button
                    className={`btn join-item ${page >= maxPage ? "btn-disabled" : ""}`}
                    onClick={() => {
                      void fetchNextPage()
                      setPage((prev) => prev + 1)
                    }}
                  >
                    »
                  </button>
                </div>
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
