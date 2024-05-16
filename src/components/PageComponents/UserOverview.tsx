import { useRef, useState } from "react"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { toggleElementInArray } from "~/helper/generalFunctions"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import CategoryForm from "../Forms/CategoryForm"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"
import { TrashIcon } from "../Icons/TrashIcon"
import { Balance } from "../General/Balance"
import { useSession } from "next-auth/react"
import UserForm from "../Forms/UserForm"

const UserOverview = () => {
  const allUsersRequest = api.user.getAllUsersDetailed.useQuery()
  const [selectedUser, setSelectedUser] = useState<Tid>()
  const animationRef = useRef<AnimationHandle>(null)
  const { data: sessionData } = useSession()

  const trpcUtils = api.useUtils()
  const [detailView, setDetailView] = useState<Tid>()

  const userIsAdmin = sessionData?.user.is_admin ?? false
  const Legend = () => (
    <tr>
      <th>Name</th>
      <th>Guthaben</th>
      <th>Kreditwürdig</th>
      <th>Admin</th>
      {userIsAdmin && <th></th>}
    </tr>
  )

  return (
    <>
      <div className="flex max-w-5xl flex-col  p-5 ">
        <div className="flex max-w-5xl grow flex-row items-center justify-center">
          <table className="table">
            {/* head */}
            <thead>
              <Legend />
            </thead>
            <tbody>
              {allUsersRequest.data?.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-bold">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td><Balance balance={user.balance}/></td>
                  <td>{user.allowOverdraw ? "🪙" : "❌"}</td>
                  <td>{user.is_admin ? "👑" : ""}</td>
                  {userIsAdmin && (
                    <th>
                    <button
                      className="btn-ghost btn-xs btn"
                      onClick={() => {
                        setSelectedUser(user.id)
                      }}
                      >
                      Edit
                    </button>
                  </th>
                    )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <Legend />
            </tfoot>
          </table>
        </div>

        <Modal open={!!selectedUser} setOpen={(a)=>setSelectedUser(undefined)}>
          <UserForm
            id={selectedUser}
            finishAction={() => setSelectedUser(undefined)}
          />
        </Modal>
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default UserOverview