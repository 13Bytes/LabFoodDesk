import { useQuery } from "@tanstack/react-query"
import { type NextPage } from "next"
import React, { useEffect, useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import Select from "react-select"
import { PlusIcon } from "../Icons/PlusIcon"

type Props = {
  finishAction: () => void
}
const AddItemForm = (props: Props) => {
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
    props.finishAction()
  }

  useEffect(() => {
    console.log(selectedCategrories)
  }, [selectedCategrories])

  return (
    <>
      <h3 className="text-lg font-bold">Neues Item</h3>
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
              <span className="label-text text-base">Preis [€]</span>
            </label>
            <input
              type="number"
              step={0.01}
              {...addItemRegister("price", { required: true, valueAsNumber: true }, )}
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
                  // @ts-ignore
                  options={options}
                  onChange={onChange}
                  isMulti={true}
                  onBlur={onBlur}
                  value={value}
                  name={name}
                  ref={ref}
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

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Item Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default AddItemForm
