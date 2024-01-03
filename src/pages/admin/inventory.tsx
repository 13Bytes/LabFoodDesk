import { useState } from "react"
import AddItemForm from "~/components/General/AddItemForm"
import AddProcurementItemForm from "~/components/General/AddProcurementItemForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { api } from "~/utils/api"

const InventoryPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const allProcurementItemsRequest = api.item.getAllProcurementItems.useQuery()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)
  const [openAddProcurementItemModal, setOpenAddProcurementItemModal] = useState(false)

  const trpcUtils = api.useContext()

  const Legend = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Preis</th>
      <th>Gruppe</th>
      <th>Kategorie(n)</th>
      <th></th>
    </tr>
  )
  const LegendProc = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Kategorie(n)</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="flex flex-col p-5">
        <div className="flex gap-3">
          <button className="btn-primary btn" onClick={() => setOpenAddItemModal(true)}>
            <CloseWindowIcon /> Produkt
          </button>
        </div>
        <div className="flex max-w-5xl grow flex-row items-center justify-center">
          <table className="table">
            {/* head */}
            <thead>
              <Legend />
            </thead>
            <tbody>
              {allItemsRequest.data?.map((item) => (
                <tr key={item.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <td>
                    <div className="flex items-center space-x-3">
                      {/* <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">ICON</div>
                      </div> */}
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.price}€</td>
                  <td>{item.for_grouporders ? "Gruppe" : "Einzel"}</td>
                  <td>{item.categories.map((cat) => cat.name).join(", ")}</td>
                  <th>
                    <button className="btn-ghost btn-xs btn">Details</button>
                  </th>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <Legend />
            </tfoot>
          </table>
        </div>

        <div className="mt-10 flex gap-3">
          <button className="btn-primary btn" onClick={() => setOpenAddProcurementItemModal(true)}>
            <CloseWindowIcon /> Vorbesteller-Item
          </button>
        </div>
        <div className="flex max-w-5xl grow flex-row items-center justify-center">
          <table className="table">
            {/* head */}
            <thead>
              <LegendProc />
            </thead>
            <tbody>
              {allProcurementItemsRequest.data?.map((item) => (
                <tr key={item.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <td>
                    <div className="flex items-center space-x-3">
                      {/* <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">ICON</div>
                      </div> */}
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.categories.map((cat) => cat.name).join(", ")}</td>
                  <th>
                    <button className="btn-ghost btn-xs btn">Details</button>
                  </th>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <LegendProc />
            </tfoot>
          </table>
        </div>

        <Modal open={openAddItemModal} setOpen={setOpenAddItemModal}>
          <AddItemForm finishAction={() => setOpenAddItemModal(false)} />
        </Modal>
        <Modal open={openAddProcurementItemModal} setOpen={setOpenAddProcurementItemModal}>
          <AddProcurementItemForm
            finishAction={() => {
              setOpenAddProcurementItemModal(false)
              trpcUtils.item.getAllProcurementItems.invalidate()
            }}
          />
        </Modal>
      </div>
    </>
  )
}

export default InventoryPage
