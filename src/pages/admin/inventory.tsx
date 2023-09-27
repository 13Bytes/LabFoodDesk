import { useQuery } from "@tanstack/react-query"
import { type NextPage } from "next"
import React, { useState } from "react"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"
import { useForm, SubmitHandler } from "react-hook-form"

const InventoryPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const allCategoriesRequest = api.category.getAll.useQuery()
  const createItemRequest = api.item.createItem.useMutation()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)

  type AddItemFormInput = {
    name: string
    price: number
    categories: string[]
  }
  const { register: addItemRegister, handleSubmit: addItemSubmit } =
    useForm<AddItemFormInput>()
  const onAddItemSubmit: SubmitHandler<AddItemFormInput> = async (data) => {
    await createItemRequest.mutateAsync(data)
    setOpenAddItemModal(false)
  }

  const Legend = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Price</th>
      <th>Categories</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <div className="flex flex-col p-5">
        <div className="flex ">
          <button
            className="btn-square btn btn-primary"
            onClick={() => setOpenAddItemModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </div>
        <div className="flex max-w-5xl grow flex-row items-center justify-center">
          <table className="table">
            {/* head */}
            <thead>
              <Legend />
            </thead>
            <tbody>
              {allItemsRequest.data?.map((item) => (
                <tr key={item.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">
                          {/* Empty icon */}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.price}</td>
                  <td></td>
                  <th>
                    <button className="btn-ghost btn-xs btn">details</button>
                  </th>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <Legend />
            </tfoot>
          </table>
        </div>

        {/* Modal */}
        <dialog
          id="modal_1"
          className={`modal ${openAddItemModal && "modal-open"}`}
        >
          <div className="modal-box">
            <button
              className="btn-ghost btn-sm btn-circle btn absolute right-2 top-2"
              onClick={() => setOpenAddItemModal(false)}
            >
              ✕
            </button>

            <h3 className="text-lg font-bold">Neues Item</h3>
            <div className="py-4">
              <form
                onSubmit={addItemSubmit(onAddItemSubmit)}
                className="space-y-4"
              >
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
                    {...addItemRegister("price", { required: true })}
                    className="input-bordered input-primary input w-full max-w-md"
                    placeholder="Preis"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-base">Categorien</span>
                  </label>
                  <input
                    type="text"
                    {...addItemRegister("categories",)}
                    className="input-bordered input-primary input w-full max-w-md"
                    placeholder="Categorie(n)"
                  />
                </div>

                <button
                  className="btn-primary btn-block btn mt-1"
                  type="submit"
                >
                  Item Anlegen
                </button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
    </>
  )
}

export default InventoryPage
