import { type NextPage } from "next"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const InventoryPage: NextPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()

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
      <div className="flex max-w-5xl grow flex-row items-center justify-center sm:p-4 md:p-7">
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
    </>
  )
}

export default InventoryPage
