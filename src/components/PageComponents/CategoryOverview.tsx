import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import Modal from "~/components/Layout/Modal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import CategoryForm from "../Forms/CategoryForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"
import { Trash2 } from "lucide-react"

const CategoryOverview = () => {
  const allItemsRequest = api.category.getAll.useQuery()
  const deleteRequest = api.category.delete.useMutation()
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
    await trpcUtils.category.invalidate()
  }

  const Legend = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Aufpreis %</th>
      <th>Aufpreis €</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="card flex max-w-6xl flex-col bg-base-200 pt-4 md:px-5">
        <div className="flex justify-between gap-3 align-bottom ">          <button className="btn btn-primary" onClick={() => setOpenAddItemModal(true)}>
            <Plus className="h-6 w-6" /> Kategorie
          </button>
          {checked.length > 0 && (
            <button className="btn btn-error btn-sm" onClick={() => deleteSelected()}>
              <Trash2 className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="flex-row items-center justify-center overflow-x-auto">
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
                  <td>{item.markupPercentage ?? 0}%</td>
                  <td>{item.markupFixed ?? 0}€</td>
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
          <CategoryForm
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

export default CategoryOverview
