import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

export const addCategoryValidationSchem = z.object({
  name: z.string(),
  markupDescription: z.string().optional(),
  markupPercentage: z.number().min(0).max(100).optional(),
  markupFixed: z.number().nonnegative().optional(),
  markupDestination: z.string().optional(),
})

type Props = {
  finishAction: () => void
  id?: Tid
}
const CategoryForm = (props: Props) => {
  const trpcUtils = api.useContext()
  const createRequest = api.category.create.useMutation()
  const updateRequest = api.category.update.useMutation()
  const category = api.category.get.useQuery({ id: props.id ?? "-" }, { enabled: !!props.id })

  const clearingAccounts = api.clearingAccount.getAll.useQuery().data ?? []

  type AddCategoryInput = z.infer<typeof addCategoryValidationSchem>

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
    reset,
    setValue
  } = useForm<AddCategoryInput>({
    resolver: zodResolver(addCategoryValidationSchem),
  })

  useEffect(() => {
    reset()
    setValue("name", category.data?.name ?? "")
    setValue("markupDestination", category.data?.markupDestinationId ?? "")
    setValue("markupPercentage", category.data?.markupPercentage ?? 0)
    setValue("markupFixed", category.data?.markupFixed ?? 0)
    setValue("markupDescription", category.data?.markupDescription ?? "")
  },[category.data, props.id??''])

  const onSubmit: SubmitHandler<AddCategoryInput> = async (data) => {
    if (!!props.id) {
      await updateRequest.mutateAsync({ id: props.id, ...data })
    } else {
      await createRequest.mutateAsync(data)
    }
    await trpcUtils.category.invalidate()
    reset()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neue Kategorie</h3>
      <div className="py-4">
        <form onSubmit={addItemSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text text-base">Name</span>
            </label>
            <input
              type="text"
              {...addItemRegister("name")}  
              className="input-bordered input-primary input w-full max-w-md"
              placeholder="Name"
            />
          </div>

          <div className="divider"></div>
          <div>
            <p className="font-semibold">Aufpreis (wenn vorhanden)</p>
          </div>

          <div>
            <label className="label">
              <span className="label-text text-base">Beschreibung für Aufpreis</span>
            </label>
            <input
              type="text"
              {...addItemRegister("markupDescription")}
              className="input-bordered input-primary input w-full max-w-md"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Aufpreis Relativ (%)</span>
            </label>
            <input
              type="number"
              step={1}
              min={0}
              max={300}
              {...addItemRegister("markupPercentage", { valueAsNumber: true })}
              className="input-bordered input-primary input w-full max-w-md"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Aufpreis Absolut (€)</span>
            </label>
            <input
              type="number"
              step={0.01}
              min={0}
              {...addItemRegister("markupFixed", { valueAsNumber: true })}
              className="input-bordered input-primary input w-full max-w-md"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Verrechnungkonto für Aufpreis</span>
            </label>
            <select
              className="select-bordered select"
              {...addItemRegister("markupDestination")}
            >
              <option key="disbld" value="">
                Auswählen:
              </option>
              {clearingAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            {!!props.id ? "Aktualisieren" : "Anlegen"}
          </button>
        </form>
      </div>
    </>
  )
}

export default CategoryForm
