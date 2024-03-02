import { useState } from "react"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ClearingAccountForm from "./ClearingAccountForm"

const ClearingAccountOverview = () => {
  const allItemsRequest = api.clearingAccount.getAll.useQuery()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)

  const trpcUtils = api.useContext()
  const [selectedAccount, setSetselectedAccount] = useState<Tid>()

  const Legend = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Kontostand</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="flex flex-col p-5">
        <div className="flex gap-3">
          <button className="btn-primary btn" onClick={() => setOpenAddItemModal(true)}>
            <CloseWindowIcon /> Verrechnungskonto
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
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{item.balance}€</div>
                  </td>
                  <th>
                    <button
                      className="btn-ghost btn-xs btn"
                      onClick={() => {
                        setSetselectedAccount(item.id)
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

        <Modal open={openAddItemModal} setOpen={setOpenAddItemModal}>
          <ClearingAccountForm
            finishAction={() => {
              setOpenAddItemModal(false)
              setSetselectedAccount(undefined)
            }}
            id={selectedAccount}
          />
        </Modal>
      </div>
    </>
  )
}

export default ClearingAccountOverview
