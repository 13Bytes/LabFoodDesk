import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { weekdays } from "~/helper/globalTypes"
import { api } from "~/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Tid } from "~/helper/zodTypes"
import { useEffect, useMemo } from "react"
import { getTimeFromDateString } from "~/helper/dataProcessing"

export const validationSchema = z.object({
  name: z.string(),
  weekday: z.number().min(0).max(6),
  ordersCloseAt_h: z.number().nonnegative(),
  ordersCloseAt_min: z.number().nonnegative(),
  ordersStartsAt: z.number().min(1).max(160),
})
export const formSchema = z.object({
  name: z.string(),
  weekday: z.number().min(0).max(6),
  ordersCloseAt: z.string(),
  ordersStartsAt: z.number().min(1).max(160),
})

type Props = {
  finishAction: () => void
  id?: Tid
}
const AddGrouporderTemplateForm = (props: Props) => {
  const trpcUtils = api.useUtils()
  const createGrouporderTemplate = api.groupOrders.createTemplate.useMutation()
  const updateGrouporderTemplate = api.groupOrders.updateTemplate.useMutation()
  const deleteGrouporderTemplate = api.groupOrders.deleteTemplate.useMutation()

  const currentGroupOrderTemplate = api.groupOrders.getTemplate.useQuery(
    { id: props.id! },
    { enabled: !!props.id },
  )

  type AddGrouporderFormInput = z.infer<typeof formSchema>

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<AddGrouporderFormInput>({
    resolver: zodResolver(formSchema),
  })

  const formValues = useMemo(
    () =>
      props.id
        ? currentGroupOrderTemplate.data
          ? {
              ...currentGroupOrderTemplate.data,
              ordersCloseAt: getTimeFromDateString(
                currentGroupOrderTemplate.data.ordersCloseAt_h,
                currentGroupOrderTemplate.data.ordersCloseAt_min,
              ),
            }
          : {}
        : { name: "", weekday: undefined, ordersCloseAt: undefined, ordersStartsAt: 72 },
    [currentGroupOrderTemplate.data, props.id],
  )

  useEffect(() => {
    reset(formValues)
  }, [reset, formValues])

  const onSubmit: SubmitHandler<AddGrouporderFormInput> = async (data) => {
    if (!data.ordersCloseAt) {
      return
    }
    const { ordersCloseAt } = data
    const [ordersCloseAt_h, ordersCloseAt_min] = ordersCloseAt.split(":").map(Number)
    const dataToSend = {
      ordersCloseAt_h: ordersCloseAt_h ?? 0,
      ordersCloseAt_min: ordersCloseAt_min ?? 0,
      ...data,
    }
    if (!!props.id) {
      await updateGrouporderTemplate.mutateAsync({ id: props.id, ...dataToSend})
    } else {
      await createGrouporderTemplate.mutateAsync(dataToSend)
    }
    props.finishAction()
    await trpcUtils.groupOrders.invalidate()
  }

  const onDelete = async () => {
    if (!!props.id) {
      await deleteGrouporderTemplate.mutateAsync({ id: props.id })
      props.finishAction()
      await trpcUtils.groupOrders.invalidate()
    }
  }

  return (
    <>
      <h3 className="text-lg font-bold">Gruppen-Kauf Vorlage</h3>
      <div className="py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
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
              <span className="label-text text-base">Wochentag</span>
            </label>
            <select
              className="select select-bordered select-primary w-full max-w-xs"
              {...register("weekday", { required: true, valueAsNumber: true })}
            >
              {/* show monday first - value stays the JS weekday (0: sunday) */}
              {[1, 2, 3, 4, 5, 6, 0].map((index) => (
                <option key={index} value={index}>
                  {weekdays[index]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Deadline für Bestellung</span>
            </label>
            <input
              type="time"
              {...register("ordersCloseAt", { required: true })}
              className="input input-primary w-full max-w-md"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Abfrage ab ...h vorher</span>
            </label>
            <input
              type="number"
              {...register("ordersStartsAt", { required: true, valueAsNumber: true })}
              className="input input-bordered input-primary w-full max-w-md"
            />
          </div>

          <button className="btn btn-primary btn-block mt-1" type="submit">
            Template {!!props.id ? "Aktualisieren" : "Anlegen"}
          </button>
        </form>
        {!!props.id && (
          <div className="flex flex-row justify-end gap-3 pt-3">
            <button className="btn btn-ghost btn-secondary" onClick={onDelete}>
              Stornieren / Löschen
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default AddGrouporderTemplateForm
