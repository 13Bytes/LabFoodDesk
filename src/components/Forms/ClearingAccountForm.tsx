import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { type Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

export const validationSchema = z.object({
  name: z.string().min(1).max(500),
})

type Props = {
  finishAction: () => void
  id?: Tid
}
const ClearingAccountForm = (props: Props) => {
  const trpcUtils = api.useUtils()
  const createRequest = api.clearingAccount.create.useMutation()
  const updateRequest = api.clearingAccount.update.useMutation()
  const clearingAccount = api.clearingAccount.get.useQuery(
    { id: props.id ?? "-" },
    { enabled: !!props.id },
  )

  type FormType = z.infer<typeof validationSchema>

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    reset,
  } = useForm<FormType>({
    resolver: zodResolver(validationSchema),
  })

  useEffect(() => {
    reset()
  }, [props.id])

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    if (!!props.id) {
      await updateRequest.mutateAsync({ id: props.id, ...data })
    } else {
      await createRequest.mutateAsync(data)
    }
    await trpcUtils.clearingAccount.invalidate()
    reset()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neues Verrechnungskonto</h3>
      <div className="max-w-md py-4">
        <form onSubmit={addItemSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
            </label>
            <input
              type="text"
              {...addItemRegister("name")}
              defaultValue={clearingAccount.data?.name ?? ""}
              className="input input-bordered input-primary w-full"
              placeholder="Name"
            />
          </div>

          <button className="btn btn-primary btn-block mt-1" type="submit">
            {!!props.id ? "Aktualisieren" : "Anlegen"}
          </button>
        </form>
      </div>
    </>
  )
}

export default ClearingAccountForm
