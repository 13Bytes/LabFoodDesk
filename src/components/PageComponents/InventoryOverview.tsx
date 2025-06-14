import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ItemForm from "../Forms/ItemForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"
import { Trash2 } from "lucide-react"

const InventoryOverview = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const deleteRequest = api.item.deleteItem.useMutation()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)
  const animationRef = useRef<AnimationHandle>(null)

  const trpcUtils = api.useUtils()
  const [detailView, setDetailView] = useState<Tid>()
  const [checked, setChecked] = useState<Tid[]>([])

  const deleteSelected = async () => {
    await Promise.all(
      checked.map(async (id) => {
        return deleteRequest.mutateAsync({ id })
      }),
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
      <th>Preis (Konto)</th>
      <th>Kategorie(n)</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="flex max-w-5xl flex-col">
        <div className="flex justify-between gap-3 align-bottom">          <button className="btn btn-primary" onClick={() => setOpenAddItemModal(true)}>
            <Plus className="h-6 w-6" /> Produkt
          </button>
          {checked.length > 0 && (
            <button className="btn btn-error btn-sm" onClick={() => deleteSelected()}>
              <Trash2 className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="max-w-5xl flex-row items-center justify-center overflow-x-auto">
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
                        {item.for_grouporders && <div className="font-extralight">(Gruppe)</div>}
                      </div>
                    </div>
                  </td>
                  <td>{item.price}€ ({item.account.name})</td>
                  <td>{item.categories.map((cat) => cat.name).join(", ")}</td>
                  <th>
                    <button
                      className="btn btn-ghost btn-xs"
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
