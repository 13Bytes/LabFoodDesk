import type { Category } from "@prisma/client"
import { useEffect, useState } from "react"
import type { Control, FieldValues, SubmitHandler } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { id } from "~/helper/zodTypes"
import { api } from "~/utils/api"


type Props = {
    control: Control<any>
    categories: Category[] | undefined
}
const CategorySelector = (props: Props) => {

    const categories = props.categories ? props.categories: []
    const options = categories.map((category) => ({
        label: category.name,
        value: category.id,
      }))

    return (
        <Controller
              control={props.control}
              name={"categories"}
              defaultValue={[]}
              render={({ field: { onChange, onBlur, value, name, ref } }) => (
                <Select
                  options={options}
                  onChange={onChange}
                  isMulti={true}
                  onBlur={onBlur}
                  // @typescript-eslint/no-unsafe-assignment
                  value={value}
                  name={name}
                  ref={ref}
                  id="select_categories"
                  key="select_categories_key"
                  styles={{
                    control: (baseStyles, _props) => ({
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
    )
}

export default CategorySelector