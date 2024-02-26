import { zodResolver } from "@hookform/resolvers/zod"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
}
const AddCategoryForm = (props: Props) => {
  const trpcUtils = api.useContext()
  const createCategroyRequest = api.category.createCategory.useMutation()
  const allClearingAccountsRequest = api.clearingAccount.getAll.useQuery()

  const clearingAccounts = allClearingAccountsRequest.data ?? []

  type AddCategoryInput = z.infer<typeof addCategoryValidationSchem>

  const {
    register: addItemRegister,
    handleSubmit: addItemSubmit,
    control,
  } = useForm<AddCategoryInput>({
    resolver: zodResolver(addCategoryValidationSchem),
  })

  const onAddItemSubmit: SubmitHandler<AddCategoryInput> = async (data) => {
    await createCategroyRequest.mutateAsync(data)
    await trpcUtils.category.invalidate()
    props.finishAction()
  }

  return (
    <>
      <h3 className="text-lg font-bold">Neue Kategorie</h3>
      <div className="py-4">
        <form onSubmit={addItemSubmit(onAddItemSubmit)} className="space-y-4">
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
              defaultValue={0}
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
              defaultValue={0}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text text-base">Verrechnungkonto für Aufpreis</span>
            </label>
            <select className="select-bordered select" defaultValue={""}>
              <option key="disbld" value="">
                Auswählen:
              </option>
              {clearingAccounts.map((account) => (
                <option key={account.id} id={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary btn-block btn mt-1" type="submit">
            Kategorie Anlegen
          </button>
        </form>
      </div>
    </>
  )
}

export default AddCategoryForm
