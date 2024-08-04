import React, { useEffect, useState } from "react"
import { boolean } from "zod"
import GrouporderForm from "~/components/Forms/GrouporderForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import RegularPage from "~/components/Layout/RegularPage"
import { localStringOptions, weekdays } from "~/helper/globalTypes"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

const InventoryPage = () => {
  const allOrderTemplateRequest = api.groupOrders.getAllTemplates.useQuery()
  const {
    data: groupOrders,
    fetchNextPage,
    hasNextPage,
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
  }, [setMaxPage, hasNextPage])

  // todo:
  // const createTemplateRequest = api.groupOrders.createTemplate.useMutation()
  const [addGrouporderModalOpen, setAddGrouporderModalOpen] = useState<Tid | boolean>(false)

  const LegendTemplates = () => (
    <tr>
      <th></th>
      <th>Aktiv</th>
      <th>Name</th>
      <th>Wochentag</th>
      <th>Wiederholung</th>
      <th></th>
    </tr>
  )

  const Legend = () => (
    <tr>
      <th>Datum</th>
      <th>Name</th>
      <th>Status</th>
      <th>Bestellungen</th>
      <th></th>
    </tr>
  )

  return (
    <RegularPage>
      <div className="max-w-7xl md:px-5">
        <div className="flex flex-col">
          <h2 className="text-xl">Wiederholungen</h2>
          <div className="flex max-w-5xl grow flex-row items-center justify-center">
            <table className="table">
              {/* head */}
              <thead>
                <LegendTemplates />
              </thead>
              <tbody>
                {allOrderTemplateRequest.data?.map((item) => (
                  <tr key={item.id}>
                    <th>
                      <label>
                        <input type="checkbox" className="checkbox" />
                      </label>
                    </th>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">{/* Empty icon */}</div>
                        </div>
                        <div>
                          <div className="font-bold">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.active ? "✅" : "❌"}</td>
                    <td>{item.name}</td>
                    <td>{weekdays[item.weekday]}</td>
                    <td>alle {item.repeatWeeks} Wochen</td>
                    <th>
                      <button className="btn btn-ghost btn-xs">Details</button>
                    </th>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <LegendTemplates />
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-7 flex flex-col">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl">Gruppen-Käufe</h2>
            <div className="flex">
              <button
                className="btn btn-square btn-primary btn-sm"
                onClick={() => setAddGrouporderModalOpen(true)}
              >
                <CloseWindowIcon />
              </button>
            </div>
          </div>

          <div className="max-w-5xl flex-row items-center justify-center overflow-x-auto">
            <table className="table">
              <thead>
                <Legend />
              </thead>
              <tbody>
                {groupOrders?.pages[page]?.items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="font-bold">
                        {order.ordersCloseAt.toLocaleDateString("de", localStringOptions)}
                      </span>
                    </td>
                    <td>{order.name}</td>
                    <td>
                      {order.status === 0 && "📥"}
                      {order.status === 5 && "💸"}
                      {order.status === 6 && "☑️"}
                      {order.status === 99 && "❌"}
                    </td>
                    <td className="flex flex-wrap gap-x-2">
                      {order.orders.map((order) => (
                        <>
                          <span key={order.id}>{order.user.name}</span>
                        </>
                      ))}
                    </td>
                    <td>
                      <div>
                        <button
                          className="btn btn-sm"
                          onClick={() => setAddGrouporderModalOpen(order.id)}
                        >
                          details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <Legend />
              </tfoot>
            </table>
          </div>
          <div className="join mt-2">
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

        <Modal setOpen={setAddGrouporderModalOpen} open={!!addGrouporderModalOpen}>
          <GrouporderForm
            finishAction={() => {
              setAddGrouporderModalOpen(false)
            }}
            id={typeof addGrouporderModalOpen === "string" ? addGrouporderModalOpen : undefined}
          />
        </Modal>
      </div>
    </RegularPage>
  )
}

export default InventoryPage
