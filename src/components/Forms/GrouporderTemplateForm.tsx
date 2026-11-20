import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { weekdays } from "~/helper/globalTypes"
import { api } from "~/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Tid } from "~/helper/zodTypes"
import { useEffect, useMemo, useState } from "react"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import { getTimeFromDateString } from "~/helper/dataProcessing"

export const validationSchema = z.object({
  name: z.string(),
  weekday: z.number().min(0).max(6),
  ordersCloseAt_h: z.number().nonnegative(),
  ordersCloseAt_min: z.number().nonnegative(),
  ordersStartsAt: z.number().min(1).max(160),
  defaultCategoryId: z.string().nullish(),
})
export const formSchema = z.object({
  name: z.string(),
  weekday: z.number().min(0).max(6),
  ordersCloseAt: z.string(),
  ordersStartsAt: z.number().min(1).max(160),
  defaultCategoryId: z.string(), // "" = no default category
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const groupOrderItems = api.item.getGroupBuyItems.useQuery()
  const groupOrderProcurementItems = api.item.getGroupBuyProcurementItems.useQuery()
  // same choice as on the group order itself: categories of all items that can be ordered
  const categories = [...(groupOrderProcurementItems.data ?? []), ...(groupOrderItems.data ?? [])]
    .flatMap((item) => item.categories)
    .filter((cat, index, all) => all.findIndex((other) => other.id === cat.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name))

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
              defaultCategoryId: currentGroupOrderTemplate.data.defaultCategoryId ?? "",
            }
          : {}
        : { name: "", weekday: undefined, ordersCloseAt: undefined, ordersStartsAt: 72, defaultCategoryId: "" },
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
      defaultCategoryId: data.defaultCategoryId || null,
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
      <h3 className="text-lg font-bold">Wiederholung</h3>
      <div className="py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
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
              <span className="label-text text-base">Wochentag</span>
            </label>
            <select
              className="select select-bordered select-primary w-full max-w-md"
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
              className="input input-bordered input-primary w-full max-w-md"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Anlegen ... Stunden vor Deadline</span>
            </label>
            <input
              type="number"
              {...register("ordersStartsAt", { required: true, valueAsNumber: true })}
              className="input input-bordered input-primary w-full max-w-md"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Standard-Kategorie</span>
            </label>
            <select
              className="select select-bordered select-primary w-full max-w-md"
              {...register("defaultCategoryId")}
            >
              <option value="">Alle Kategorien</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-base-content/60">
              Wird bei neuen Gruppen-Käufen vorausgewählt und kann dort geändert werden.
            </p>
          </div>

          <div className="mt-1 flex flex-row gap-3">
            {!!props.id && (
              <button className="btn btn-ghost hover:btn-error" type="button" onClick={() => setConfirmDelete(true)}>
                Löschen
              </button>
            )}
            <button className="btn btn-primary flex-1" type="submit">
              {!!props.id ? "Aktualisieren" : "Anlegen"}
            </button>
          </div>
        </form>
      </div>
      <ConfirmationModal
        open={confirmDelete}
        close={() => setConfirmDelete(false)}
        proceed={onDelete}
        title="Wiederholung löschen?"
        proceedText="Löschen"
        proceedButtonClass="btn btn-error"
        // opened from inside another modal - keep it on top
        className="z-[1000]"
      >
        <p>Es werden keine neuen Gruppen-Käufe mehr aus dieser Wiederholung angelegt.</p>
      </ConfirmationModal>
    </>
  )
}

export default AddGrouporderTemplateForm
