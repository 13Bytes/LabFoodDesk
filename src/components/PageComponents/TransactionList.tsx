import { RouterOutputs } from "~/utils/api"

import { localStringOptions } from "~/helper/globalTypes"

type TransactionData = RouterOutputs["transaction"]["getAllInfinite"]["items"]
type Props = {
  transactions: TransactionData | undefined
}
const TransactionList = (props: Props) => {
  const Legend = () => (
    <tr>
      <th>Transaction</th>
      <td>Type</td>
      <td>Amount (€)</td>
      <td>User (auführend)</td>
      <td>Ziel</td>
      <td>Verrechnungskonto</td>
    </tr>
  )

  if (props.transactions === undefined) {
    return (
      <>
        <span className="loading loading-spinner loading-lg m-6"></span>
      </>
    )
  } else {
    return (
      <>
        <div className="w-dvw max-w-5xl flex-col md:px-5">
          <div className="mr-2 grow flex-row items-center justify-center overflow-x-auto">
            <table className="table">
              {/* head */}
              <thead>
                <Legend />
              </thead>
              <tbody>
                {props.transactions.map((row) => (
                  <tr key={row.id} className={`${row.canceled ? "line-through" : ""}`}>
                    <td>
                      <div className="flex flex-col">
                        <p>{row.createdAt.toLocaleString("de", localStringOptions)}</p>
                        <p className="text-xs font-extralight">{row.id}</p>
                        {row.canceledBy && (
                          <p className="text-red-500 no-underline">
                            canceled by {row.canceledBy.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>{row.type}</td>
                    <td>
                      {row.totalAmount?.toFixed(2)}{" "}
                      {!!row.amountWithoutFees && "(" + row.amountWithoutFees?.toFixed(2) + ")"}
                    </td>
                    <td>{row.user.name}</td>
                    <td>{row.moneyDestination?.name}</td>
                    <td>{row.clearingAccount?.name}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <Legend />
              </tfoot>
            </table>
          </div>
        </div>
      </>
    )
  }
}

export default TransactionList
