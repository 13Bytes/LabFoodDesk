import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import FadingCheckmark, { AnimationHandle } from "~/components/General/FadingChekmark"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const SplitPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const allUserRequest = api.user.getAllUsers.useQuery()

  const session = useSession()
  const [amount, setAmount] = useState<number>(1)
  const [selectedDestinationUser, setSelectedDestinationUser] =
    useState<string>()
  const [errorMessage, setErrorMessage] = useState("")
  const checkboxRef = useRef<AnimationHandle>(null);

  const apiBuyOneItem = api.item.buyOneItem.useMutation()
  const apiSendmMoney = api.transaction.sendMoney.useMutation()

  const sendMoneyAction = () => {
    if (selectedDestinationUser) {
      setErrorMessage("")
      apiSendmMoney.mutate({
        amount: amount,
        destinationUserId: selectedDestinationUser,
      })
      setAmount(1)
      setSelectedDestinationUser(undefined)
      if(checkboxRef.current){
        checkboxRef.current.check()
      }
    } else {
      setErrorMessage("Bitte wähle einen Empfänger aus")
    }
  }

  useEffect(() => {
    console.log(selectedDestinationUser)
  }, [selectedDestinationUser])

  return (
    <>
      <CenteredPage>
        <h3 className="self-start text-xl">Geld senden</h3>

        <div className="flex flex-row flex-wrap items-center gap-1">
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

          <div className="mx-1">
            von <span className="font-bold">{session.data?.user.name}</span> an
          </div>

          <div className="">
            <select
              className="select-bordered select w-full max-w-xs font-bold"
              value={
                !!(selectedDestinationUser && allUserRequest.data)
                  ? allUserRequest.data.find(
                      (user) => user.id === selectedDestinationUser
                    )!.name!
                  : "Auswählen:"
              }
              onChange={(e) => {
                setSelectedDestinationUser(
                  e.target.options[e.target.selectedIndex]?.id
                )
              }}
            >
              <option className="disabled">Auswählen:</option>
              {allUserRequest.data?.map((user) => {
                if (user.id !== session.data?.user.id)
                  return (
                    <option id={user.id} className="">
                      {user.name}
                    </option>
                  )
              })}
            </select>
          </div>

          <div>
            <button
              className={`btn ml-5 ${
                !selectedDestinationUser && "btn-disabled"
              }`}
              onClick={() => sendMoneyAction()}
            >
              Senden
            </button>
          </div>
          
          <FadingCheckmark ref={checkboxRef} />


        </div>

        <p className="mt-3 text-lg font-bold text-error-content">
          {errorMessage}
        </p>
      </CenteredPage>
    </>
  )
}

export default SplitPage
