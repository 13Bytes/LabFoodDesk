import { useRef, useState } from "react"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ItemForm from "../Forms/ItemForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"
import { TrashIcon } from "../Icons/TrashIcon"

const InventoryOverview = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const deleteRequest = api.item.deleteItem.useMutation()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useContext()
  const [detailView, setDetailView] = useState<Tid>()
  const [checked, setChecked] = useState<Tid[]>([])

  const deleteSelected = async () => {
    await Promise.all(
      checked.map(async (id) => {
        return deleteRequest.mutateAsync({ id })
      })
    ).catch((e) => {
      console.error(e)
      animate(animationRef, "failure")
    })
    setChecked([])
    await trpcUtils.item.invalidate()
  }

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

  return (
    <>
      <div className="flex max-w-5xl flex-col  p-5 ">
        <div className="flex justify-between gap-3 align-bottom">
          <button className="btn-primary btn" onClick={() => setOpenAddItemModal(true)}>
            <CloseWindowIcon /> Produkt
          </button>
          {checked.length > 0 && (
            <button className="btn-error btn-sm btn" onClick={() => deleteSelected()}>
              <TrashIcon />
            </button>
          )}
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
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={checked.includes(item.id)}
                        onChange={() => setChecked((old) => toggleElementInArray(old, item.id))}
                      />
                    </label>
                  </th>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.price}€</td>
                  <td>{item.for_grouporders ? "Gruppe" : "Einzel"}</td>
                  <td>{item.categories.map((cat) => cat.name).join(", ")}</td>
                  <th>
                    <button
                      className="btn-ghost btn-xs btn"
                      onClick={() => {
                        setDetailView(item.id)
                        setOpenAddItemModal(true)
                      }}
                    >
                      Details
                    </button>
                  </th>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <Legend />
            </tfoot>
          </table>
        </div>

        <Modal
          open={openAddItemModal}
          setOpen={setOpenAddItemModal}
          closeFunctionCall={() => setDetailView(undefined)}
        >
          <ItemForm
            finishAction={() => {
              setOpenAddItemModal(false)
              setDetailView(undefined)
            }}
            id={detailView}
          />
        </Modal>
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default InventoryOverview
