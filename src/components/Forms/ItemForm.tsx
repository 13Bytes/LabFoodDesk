import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Tid, formCategories, id } from "~/helper/zodTypes"
import { api } from "~/utils/api"
import CategorySelector from "../FormElements/CategorySelector"

export const createItemSchema = z.object({
  name: z.string(),
  categories: z.array(id),
  price: z.number(),
  for_grouporders: z.boolean().optional().default(false),
})
export type AddItem = z.infer<typeof createItemSchema>

const itemValidationSchema = createItemSchema.omit({ categories: true }).merge(formCategories)

type Props = {
  finishAction: () => void
  id?: Tid
}
const ItemForm = (props: Props) => {
  const trpcUtils = api.useUtils()

  const allCategoriesRequest = api.category.getAll.useQuery()
  const createItemRequest = api.item.createItem.useMutation()
  const updateItemRequest = api.item.updateItem.useMutation()

  const currentItem = api.item.getItem.useQuery({ id: props.id! }, { enabled: !!props.id })

  type AddItemForm = z.infer<typeof itemValidationSchema>

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddItemForm>({
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
      reset({ name: "", price: 0, for_grouporders: false, categories: [] })
    }
  }, [currentItem.data, props.id ?? ""])

  const onSubmit: SubmitHandler<AddItemForm> = async (data) => {
    const dataToSend = {
      ...data,
      categories: data.categories.map((category) => category.value),
    }
    if (!!props.id) {
      await updateItemRequest.mutateAsync({ id: props.id, ...dataToSend })
    } else {
      await createItemRequest.mutateAsync(dataToSend)
    }

    await trpcUtils.item.getAll.invalidate()
    reset()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neues Item</h3>
      <div className="py-4">
        <form onSubmit={addItemSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
            </label>
            <input
              type="text"
              {...addItemRegister("name", { required: true })}
              className="input input-bordered input-primary w-full max-w-md"
              placeholder="Name"
            />
            {errors.name && <p>{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Preis [€]</span>
            </label>
            <input
              type="number"
              step={0.01}
              {...addItemRegister("price", {
                required: true,
                valueAsNumber: true,
              })}
              className="input input-bordered input-primary w-full max-w-md"
              placeholder="Preis"
            />
            {errors.price && <p>{errors.price.message}</p>}
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Categorien</span>
            </label>
            <CategorySelector control={control} categories={allCategoriesRequest.data} />
            {errors.categories && <p>{errors.categories.message}</p>}
          </div>
          <div>
            <span className="label-text text-base">Für Gruppenkäufe</span>
            <input type="checkbox" className="ml-3" {...addItemRegister("for_grouporders")} />
            {errors.for_grouporders && <p>{errors.for_grouporders.message}</p>}
          </div>

          <button className="btn btn-primary btn-block mt-1" type="submit">
            Item Anlegen
          </button>
        </form>
        {/* <DevTool control={control} /> */}
      </div>
    </>
  )
}

export default ItemForm
