import React, { useEffect, useState } from "react"
import AddGrouporderForm from "~/components/General/AddGrouporderForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { localStringOptions, weekdays } from "~/helper/globalTypes"
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
    }
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

  const createTemplateRequest = api.groupOrders.createTemplate.useMutation()
  const [addGrouporderModalOpen, setAddGrouporderModalOpen] = useState(false)

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
    <>
      <div className="max-w-7xl">
        <div className="flex flex-col p-5">
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
                      <button className="btn-ghost btn-xs btn">Details</button>
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

        <div className="mt-7 flex flex-col p-5 ">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl">Gruppen-Käufe</h2>
            <div className="flex ">
              <button
                className="btn-primary btn-square btn-sm btn"
                onClick={() => setAddGrouporderModalOpen(true)}
              >
                <CloseWindowIcon />
              </button>
            </div>
          </div>

          <div className="flex max-w-5xl grow flex-row items-center justify-center">
            <table className="table overflow-x-auto">
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
                      {order.status === 99 && "❌"}
                      {order.status !== 99 && order.ordersCloseAt > new Date() ? `📥` : `✅`}
                    </td>
                    <td>
                      {order.orders.map((order) => (
                        <span key={order.id}>{order.user.name}</span>
                      ))}
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
              className={`join-item btn ${page < 1 ? "btn-disabled" : ""}`}
              onClick={() => setPage((prev) => prev - 1)}
            >
              «
            </button>
            <button className="join-item btn pointer-events-none">Seite {page + 1}</button>
            <button
              className={`join-item btn ${page >= maxPage ? "btn-disabled": ""}`}
              onClick={() => {
                void fetchNextPage()
                setPage((prev) => prev + 1)
              }}
            >
              »
            </button>
          </div>
        </div>

        <Modal setOpen={setAddGrouporderModalOpen} open={addGrouporderModalOpen}>
          <AddGrouporderForm finishAction={() => setAddGrouporderModalOpen(false)} />
        </Modal>
      </div>
    </>
  )
}

export default InventoryPage
