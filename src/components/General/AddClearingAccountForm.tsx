import { zodResolver } from "@hookform/resolvers/zod"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { api } from "~/utils/api"

export const validationSchema = z.object({
  name: z.string().min(1).max(500),
})

type Props = {
  finishAction: () => void
}
const AddClearingAccountForm = (props: Props) => {
  const trpcUtils = api.useContext()
  const createRequest = api.clearingAccount.create.useMutation()

  type FormType = z.infer<typeof validationSchema>

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
  } = useForm<FormType>({
    resolver: zodResolver(validationSchema),
  })

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    await createRequest.mutateAsync(data)
    await trpcUtils.clearingAccount.invalidate()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neues Verrechnungskonto</h3>
      <div className="py-4">
        <form onSubmit={addItemSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
            </label>
            <input
              type="text"
              {...addItemRegister("name")}
              className="input-bordered input-primary input w-full max-w-md"
              placeholder="Name"
            />
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default AddClearingAccountForm
