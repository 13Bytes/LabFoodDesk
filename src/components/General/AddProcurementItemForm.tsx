import { useEffect, useState } from "react"
import type { SubmitHandler } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { id } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import CategorySelector from "../FormElements/CategorySelector"
import type { Overwrite } from "@trpc/server"


export const validationSchema = z.object({
  name: z.string(),
  categories: z.array(id),
})

type Props = {
  finishAction: () => void
}
const AddProcurementItemForm = (props: Props) => {
  const trpcUtils = api.useContext()

  type AddProcurementItem = z.infer<typeof validationSchema>
  type AddProcurementItemForm = Overwrite<AddProcurementItem, { categories: { label: string; value: string }[] }>
  const allCategoriesRequest = api.category.getAll.useQuery()
  const createProcurementItemRequest = api.item.createProcurementItem.useMutation()

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
  } = useForm<AddProcurementItemForm>()

  const onAddItemSubmit: SubmitHandler<AddProcurementItemForm> = async (data) => {
    const dataToSend = {
      ...data,
      categories: data.categories.map((category) => category.value),
    }
    await createProcurementItemRequest.mutateAsync(dataToSend)
    await trpcUtils.item.getAll.invalidate()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neues Vorbesteller-Item</h3>
      <div className="py-4">
        <form onSubmit={addItemSubmit(onAddItemSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
            </label>
            <input
              type="text"
              {...addItemRegister("name", { required: true })}
              className="input-bordered input-primary input w-full max-w-md"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Categorien</span>
            </label>
            <CategorySelector control={control} categories={allCategoriesRequest.data}  />
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Item Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default AddProcurementItemForm
