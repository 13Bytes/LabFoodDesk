import { useState } from "react"
import AddCategoryForm from "~/components/General/AddCategoryForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { api } from "~/utils/api"

const CategoryOverview = () => {
  const allCategoriesRequest = api.category.getAll.useQuery()
  const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false)

  const trpcUtils = api.useContext()

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
                  <td>
                     {item.markupPercentage?? 0}%
                  </td>
                  <td>
                     {item.markupFixed?? 0}€
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
          <AddCategoryForm finishAction={() => setOpenAddCategoryModal(false)} />
        </Modal>
    </>
  )
}

export default CategoryOverview
