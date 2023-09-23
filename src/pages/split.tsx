import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const allUserRequest = api.user.getAllUsers.useQuery()

  const session = useSession()
  const [amount, setAmount] = useState<number>(1)
  const [errorMessage, setErrorMessage] = useState()

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const buyAction = (itemID: string) => {
    apiBuyOneItem.mutate({ productID: itemID })
  }

  return (
    <>
      <CenteredPage>
        <h3 className="self-start text-xl">Geld senden</h3>

        <div className="flex flex-row items-center gap-1 flex-wrap">
          <div className="flex flex-row items-center">
            <div className="form-control flex">
              <input
                type="number"
                className="input-bordered input w-20"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
              />
            </div>
            <div className="ml-1">€</div>
          </div>

          <div className="mx-5">
            von <span className="font-bold">{session.data?.user.name}</span> an
          </div>

          <div className="">
            <select className="select-bordered select w-full max-w-xs">
              {allUserRequest.data?.map((user) => {
                if (user.id !== session.data?.user.id)
                  return <option>{user.name}</option>
              })}
            </select>
          </div>

          <div>
            <button className="btn ml-5" onClick={() => alert('#todo')}>Senden</button>
          </div>
        </div>
        
        <p className="font-bold text-error-content mt-3 text-lg">{errorMessage}</p>
      </CenteredPage>
    </>
  )
}

export default SplitPage
