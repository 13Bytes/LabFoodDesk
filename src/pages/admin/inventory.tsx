import { useState } from "react"
import AddItemForm from "~/components/General/AddItemForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import { api } from "~/utils/api"

const InventoryPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const createItemRequest = api.item.createItem.useMutation()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)

  const Legend = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Preis</th>
      <th>Kategorie(n)</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="flex flex-col p-5">
        <div className="flex ">
          <button
            className="btn-primary btn-square btn"
            onClick={() => setOpenAddItemModal(true)}
          >
            <CloseWindowIcon />
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
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">
                          {/* Empty icon */}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.price}€</td>
                  <td></td>
                  <th>
                    <button className="btn-ghost btn-xs btn">details</button>
                  </th>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <Legend />
            </tfoot>
          </table>
        </div>

        {/* Modal */}
        <dialog
          id="modal_1"
          className={`modal ${openAddItemModal && "modal-open"}`}
        >
          <div className="modal-box">
            <button
              className="btn-ghost btn-sm btn-circle btn absolute right-2 top-2"
              onClick={() => setOpenAddItemModal(false)}
            >
              ✕
            </button>
            <AddItemForm finishAction={() => setOpenAddItemModal(false)} />
          </div>
        </dialog>
      </div>
    </>
  )
}

export default InventoryPage
