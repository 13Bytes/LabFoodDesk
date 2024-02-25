import { useState } from "react"
import AddItemForm from "~/components/General/AddItemForm"
import AddProcurementItemForm from "~/components/General/AddProcurementItemForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { api } from "~/utils/api"

const CategoryPage = () => {
  const allCategoriesRequest = api.category.getAll.useQuery()
  const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false)

  const trpcUtils = api.useContext()

  const Legend = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="flex flex-col p-5">
        <div className="flex gap-3">
          <button className="btn-primary btn" onClick={() => setOpenAddCategoryModal(true)}>
            <CloseWindowIcon /> Kategorie
          </button>
        </div>
        <div className="flex max-w-5xl grow flex-row items-center justify-center">
          <table className="table">
            {/* head */}
            <thead>
              <Legend />
            </thead>
            <tbody>
              {allCategoriesRequest.data?.map((item) => (
                <tr key={item.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
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

        <Modal open={openAddCategoryModal} setOpen={setOpenAddCategoryModal}>
          <AddItemForm finishAction={() => setOpenAddCategoryModal(false)} />
        </Modal>
      </div>
    </>
  )
}

export default CategoryPage
