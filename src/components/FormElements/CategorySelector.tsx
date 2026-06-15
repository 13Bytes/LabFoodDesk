import type { Category } from "~/generated/prisma/client"
import type { Control, FieldValues, Path } from "react-hook-form"
import { Controller } from "react-hook-form"
import Select from "react-select"

type CategoryOption = {
  label: string
  value: string
}

type Props<
  TFieldValues extends FieldValues,
  TContext,
  TTransformedValues extends FieldValues | undefined,
> = {
    control: Control<TFieldValues, TContext, TTransformedValues>
    categories: Category[] | undefined
}
const CategorySelector = <
  TFieldValues extends FieldValues,
  TContext,
  TTransformedValues extends FieldValues | undefined,
>(
  props: Props<TFieldValues, TContext, TTransformedValues>,
) => {

    const categories = props.categories ? props.categories: []
    const options = categories.map((category) => ({
        label: category.name,
        value: category.id,
      }))

    return (
      <Controller
        control={props.control}
        name={"categories" as Path<TFieldValues>}
        render={({ field: { onChange, onBlur, value, name, ref } }) => (
          <Select<CategoryOption, true>
            options={options}
            onChange={onChange}
            isMulti={true}
            onBlur={onBlur}
            value={value as CategoryOption[] | undefined}
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
