import type { Category } from "@prisma/client"
import type { Control } from "react-hook-form"
import { Controller } from "react-hook-form"
import Select from "react-select"


type Props = {
   // eslint-disable-next-line  @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            value={value}
            name={name}
            ref={ref}
            id="select_categories"
            key="select_categories_key"
            styles={{
              control: (baseStyles, _props) => ({
                ...baseStyles,
                backgroundColor: "transparent",
                borderColor: "#7480ff",
                boxShadow: "none",
                ":hover": { borderColor: "#7480ff" },
              }),
            }}
          />
        )}
      />
    )
}

export default CategorySelector