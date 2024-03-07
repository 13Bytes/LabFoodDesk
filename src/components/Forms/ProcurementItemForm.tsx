import { useEffect, useState } from "react"
import type { SubmitHandler } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { Tid, formCategories, id } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import CategorySelector from "../FormElements/CategorySelector"
import type { Overwrite } from "@trpc/server"
import { zodResolver } from "@hookform/resolvers/zod"


export const createProcItemSchema = z.object({
  name: z.string(),
  categories: z.array(id),
})
const itemValidationSchema = createProcItemSchema.omit({ categories: true }).merge(formCategories)

type Props = {
  finishAction: () => void
  id?: Tid
}
const ProcurementItemForm = (props: Props) => {
  const trpcUtils = api.useContext()

  type AddProcurementItemForm = z.infer<typeof itemValidationSchema>
  const allCategoriesRequest = api.category.getAll.useQuery()
  const createProcurementItemRequest = api.item.createProcurementItem.useMutation()
  const currentItem = api.item.getProcurementItem.useQuery({ id: props.id! }, { enabled: !!props.id })

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddProcurementItemForm>({
    resolver: zodResolver(itemValidationSchema),
})

useEffect(() => {
  if (props.id) {
    const mappedData = {
      ...currentItem.data,
      categories: currentItem.data?.categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    }
    reset(mappedData)
  } else {
    reset({name: "",  categories: []})
  }
}, [currentItem.data, props.id ?? ""])

  const onAddItemSubmit: SubmitHandler<AddProcurementItemForm> = async (data) => {
    const dataToSend = {
      ...data,
      categories: data.categories.map((category) => category.value),
    }
    await createProcurementItemRequest.mutateAsync(dataToSend)
    await trpcUtils.item.invalidate()
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
            {errors.name && <p>{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Categorien</span>
            </label>
            <CategorySelector control={control} categories={allCategoriesRequest.data}  />
            {errors.categories && <p>{errors.categories.message}</p>}
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Item Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default ProcurementItemForm
