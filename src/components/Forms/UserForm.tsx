import { zodResolver } from "@hookform/resolvers/zod"
import { use, useState } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { type Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

type Props = {
  finishAction: () => void
  id?: Tid
}
const UserForm = (props: Props) => {
  const trpcUtils = api.useUtils()
  const updateRequest = api.user.updateUser.useMutation()
  const userDate = api.user.getUser.useQuery({ id: props.id! }, { enabled: !!props.id })
  const [allowOverdrawOverride, setAllowOverdrawOverride] = useState<boolean | null>(null)
  const allowOverdraw = allowOverdrawOverride ?? userDate.data?.allowOverdraw ?? false

  const save = async () => {
    if (!!props.id) {
      await updateRequest.mutateAsync({ id: props.id, allowOverdraw: allowOverdraw })
      await trpcUtils.user.invalidate()
      props.finishAction()
    }
  }

  return (
    <>
      <h3 className="text-lg font-bold">User: {userDate?.data?.name}</h3>
      <p className="">{userDate?.data?.id}</p>

      <div className="py-6">
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">User darf Konto überziehen?</span>
            <input
              type="checkbox"
              className="checkbox"
              checked={allowOverdraw}
              onClick={() => setAllowOverdrawOverride(!allowOverdraw)}
            />
          </label>
        </div>
      </div>
        <button className="btn btn-primary btn-block" onClick={save}>
          Speichern
        </button>
    </>
  )
}

export default UserForm
