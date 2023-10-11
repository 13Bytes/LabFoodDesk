import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { weekdays } from "~/helper/globalTypes"
import { api } from "~/utils/api"

export const validationSchema = z.object({
  name: z.string(),
  weekday: z.number().min(0).max(6),
  repeatWeeks: z.number().positive().optional(),
  ordersCloseAt: z.date(),
})

type Props = {
  finishAction: () => void
}
const AddGrouporderTemplateForm = (props: Props) => {
  const trpcUtils = api.useContext()
  const createGrouporderTemplate = api.groupOrders.createTemplate.useMutation()

  type AddGrouporderFormInput = z.infer<typeof validationSchema>

  const { register, handleSubmit } = useForm<AddGrouporderFormInput>({
    // resolver: zodResolver(validationSchema),
  })

  const onSubmit: SubmitHandler<AddGrouporderFormInput> = async (data) => {
    await createGrouporderTemplate.mutateAsync(data)
    await trpcUtils.item.getAll.invalidate()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neues Item</h3>
      <div className="py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
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
              <span className="label-text text-base">Wochentag</span>
            </label>
            <select className="select-bordered select w-full max-w-xs" {...register("weekday")}>
              {weekdays.map((day, index) => (
                <option value={index}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Wiederholung</span>
            </label>
            <input
              type="number"
              {...register("repeatWeeks", { required: true, valueAsNumber: true })}
              className="input-bordered input-primary input w-full max-w-md"
              placeholder="Name"
              min={0}
              step={1}
            />
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Template Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default AddGrouporderTemplateForm
