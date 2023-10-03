import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { id } from "~/helper/zodTypes"
import { api } from "~/utils/api"

export const validationSchema = z.object({
  name: z.string().optional(),
  ordersCloseAt: z.date(),
  groupOrderTemplate: id.optional(),
})

type Props = {
  finishAction: () => void
}
const AddGrouporderForm = (props: Props) => {
  const trpcUtils = api.useContext()
  const createGrouporder = api.groupOrders.create.useMutation()

  type AddGrouporderFormInput = z.infer<typeof validationSchema>

  const { register, handleSubmit } = useForm<AddGrouporderFormInput>()

  const onSubmit: SubmitHandler<AddGrouporderFormInput> = async (data) => {
    await createGrouporder.mutateAsync(data)
    await trpcUtils.groupOrders.invalidate()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neuer Gruppen-Kauf</h3>
      <div className="py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Beschreibung</span>
            </label>
            <input
              type="text"
              {...register("name", { required: true })}
              className="input-bordered input-primary input w-full max-w-md"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Deadline für Bestellung</span>
            </label>
            <input
              type="datetime-local"
              {...register("ordersCloseAt", { required: true, valueAsDate: true })}
              className="input-bordered input-primary input w-full max-w-md"
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

export default AddGrouporderForm
