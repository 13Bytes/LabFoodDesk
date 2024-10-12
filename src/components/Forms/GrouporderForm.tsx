import type { Overwrite } from "@trpc/server"
import { useEffect, useRef } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { id, Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import ActionResponsePopup, { AnimationHandle, animate } from "../General/ActionResponsePopup"

export const validationSchema = z.object({
  name: z.string().optional(),
  ordersCloseAt: z.date(),
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

  type AddGrouporderInput = z.infer<typeof validationSchema>
  type AddGrouporderFormInput = Overwrite<AddGrouporderInput, { ordersCloseAt: string }>

  const { register, handleSubmit, reset, getValues } = useForm<AddGrouporderFormInput>({
    resolver: zodResolver(validationSchema),
  })

  useEffect(() => {
    if (props.id) {
      const mappedData = {
        name: currentGroupOrder.data?.name ?? "",
        ordersCloseAt: currentGroupOrder.data?.ordersCloseAt.toISOString().split(":", 2).join(":"),
      }
      reset(mappedData)
    } else {
      reset({ name: "", ordersCloseAt: "" })
    }
  }, [currentGroupOrder.data, props.id ?? ""])

  const onSubmit: SubmitHandler<AddGrouporderFormInput> = async (data) => {
    const dataToSend = {
      ...data,
      ordersCloseAt: data.ordersCloseAt as unknown as Date, // tranformation of react-hook-form not visible to ts : (
    }
    if (!!props.id) {
      await updateGrouporder.mutateAsync({ id: props.id, ...dataToSend })
    } else {
      await createGrouporder.mutateAsync(dataToSend)
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
      } catch (e) {
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
              className="input input-bordered input-primary w-full max-w-md"
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
              className="input input-bordered input-primary w-full max-w-md"
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
