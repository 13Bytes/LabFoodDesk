import { useEffect, useMemo, useRef } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { id, type Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ActionResponsePopup, { type AnimationHandle, animate } from "../General/ActionResponsePopup"

export const validationSchema = z.object({
  name: z.string().optional(),
  ordersCloseAt: z.coerce.date<string>(),
  groupOrderTemplate: id.optional(),
})

type Props = {
  finishAction: () => void
  id?: Tid
}
const AddGrouporderForm = (props: Props) => {
  const trpcUtils = api.useUtils()
  const createGrouporder = api.groupOrders.create.useMutation()
  const updateGrouporder = api.groupOrders.update.useMutation()
  const deleteGrouporder = api.groupOrders.delete.useMutation()

  const animationRef = useRef<AnimationHandle>(null)

  const currentGroupOrder = api.groupOrders.get.useQuery({ id: props.id! }, { enabled: !!props.id })

  type AddGrouporderFormInput = z.input<typeof validationSchema>
  type AddGrouporderInput = z.output<typeof validationSchema>

  const { register, handleSubmit, reset } = useForm<
    AddGrouporderFormInput,
    unknown,
    AddGrouporderInput
  >({
    resolver: zodResolver(validationSchema),
  })

  const formValues = useMemo(
    () =>
      props.id
        ? {
            name: currentGroupOrder.data?.name ?? "",
            ordersCloseAt: currentGroupOrder.data?.ordersCloseAt.toISOString().split(":", 2).join(":"),
          }
        : { name: "", ordersCloseAt: "" },
    [currentGroupOrder.data, props.id],
  )

  useEffect(() => {
    reset(formValues)
  }, [reset, formValues])

  const onSubmit: SubmitHandler<AddGrouporderInput> = async (data) => {
    const input = {
      ...data,
      ordersCloseAt: data.ordersCloseAt.toISOString(),
    }
    if (!!props.id) {
      await updateGrouporder.mutateAsync({ id: props.id, ...input })
    } else {
      await createGrouporder.mutateAsync(input)
    }
    await trpcUtils.groupOrders.invalidate()
    props.finishAction()
  }

  const deleteGroupOrder = async () => {
    if (!!props.id) {
      try {
        await deleteGrouporder.mutateAsync({ id: props.id })
        props.finishAction()
        await trpcUtils.groupOrders.invalidate()
      } catch {
        animate(animationRef, "failure")
      }
    }
  }

  return (
    <>
      <h3 className="text-lg font-bold">Gruppen-Kauf</h3>
      <div className="py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Beschreibung</span>
            </label>
            <input
              type="text"
              {...register("name", { required: true })}
              className="input input-primary w-full max-w-md"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Deadline für Bestellung</span>
            </label>
            <input
              type="datetime-local"
              {...register("ordersCloseAt", { required: true })}
              className="input input-primary w-full max-w-md"
            />
          </div>

          <button className="btn btn-primary btn-block mt-1" type="submit">
            {!!props.id ? "Aktualisieren" : "Anlegen"}
          </button>
        </form>
        {!!props.id && currentGroupOrder.data?.status === 0 && (
          <div className="flex flex-row justify-end gap-3 pt-3">
            <button className="btn btn-ghost btn-secondary" onClick={deleteGroupOrder}>
              Stornieren / Löschen
            </button>
          </div>
        )}
      </div>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default AddGrouporderForm
