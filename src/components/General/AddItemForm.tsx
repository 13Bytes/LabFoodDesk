import { useEffect, useState } from "react"
import type { SubmitHandler } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import Select from "react-select"
import { api } from "~/utils/api"

type Props = {
  finishAction: () => void
}
const AddItemForm = (props: Props) => {
  const trpcUtils = api.useContext()

  const allCategoriesRequest = api.category.getAll.useQuery()
  const createItemRequest = api.item.createItem.useMutation()

  const [selectedCategrories, setSelectedCategories] = useState([])

  const options = allCategoriesRequest.data?.map((category) => ({
    label: category.name,
    value: category.id,
  }))

  type AddItemFormInput = {
    name: string
    price: number
    categories: { label: string; value: string }[]
    for_grouporders: boolean
  }

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
  } = useForm<AddItemFormInput>()

  const onAddItemSubmit: SubmitHandler<AddItemFormInput> = async (data) => {
    const dataToSend = {
      ...data,
      categories: data.categories.map((category) => category.value),
    }
    await createItemRequest.mutateAsync(dataToSend)
    await trpcUtils.item.getAll.invalidate()
    props.finishAction()
  }

  useEffect(() => {
    console.log(selectedCategrories)
  }, [selectedCategrories])

  return (
    <>
      <h3 className="text-lg font-bold">Neues Item</h3>
      <div className="py-4">
        <form onSubmit={(_event) => void addItemSubmit(onAddItemSubmit)} className="space-y-4">
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
              <span className="label-text text-base">Preis [€]</span>
            </label>
            <input
              type="number"
              step={0.01}
              {...addItemRegister("price", {
                required: true,
                valueAsNumber: true,
              })}
              className="input-bordered input-primary input w-full max-w-md"
              placeholder="Preis"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Categorien</span>
            </label>
            <Controller
              control={control}
              name={"categories"}
              defaultValue={[]}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <Select
                  options={options}
                  onChange={onChange}
                  isMulti={true}
                  onBlur={onBlur}
                  value={value}
                  name={name}
                  ref={ref}
                  id="select_categories"
                  key="select_categories_key"
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      backgroundColor: "transparent",
                      borderColor: "#6419E6",
                      boxShadow: "none",
                      ":hover": { borderColor: "#6419E6" },
                    }),
                  }}
                />
              )}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Für Gruppenkäufe</span>
            </label>
            <input
              type="checkbox"
              {...addItemRegister("for_grouporders", {
                required: true,
              })}
            />
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Item Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default AddItemForm
