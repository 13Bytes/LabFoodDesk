import { RouterOutputs } from "~/utils/api"
import { Receipt, User, Target, Wallet, Calendar, Ban, AlertCircle } from "lucide-react"
import { localStringOptions } from "~/helper/globalTypes"

type TransactionData = RouterOutputs["transaction"]["getAllInfinite"]["items"]
type Props = {
  transactions: TransactionData | undefined
}
const TransactionList = (props: Props) => {
  const Legend = () => (
    <tr>
      <th>Datum & Zeit</th>
      <th>Typ</th>
      <th className="text-right">Betrag</th>
      <th>Benutzer</th>
      <th>Ziel</th>
      <th>Verrechnungskonto</th>
    </tr>
  )

  if (props.transactions === undefined) {
    return (
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body p-6">
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      </div>
    )
  }

  if (props.transactions.length === 0) {
    return (
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body p-6">
          <div className="py-12 text-center">
            <div className="space-y-2 text-base-content/50">
              <Receipt className="mx-auto h-16 w-16 opacity-30" />
              <p className="text-lg">Keine Transaktionen vorhanden</p>
              <p className="text-sm">Es wurden noch keine Transaktionen durchgeführt</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-xl">
      <div className="card-body p-6">
        {/* Header Section */}
        <div className="mb-6 flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-base-content">Transaktionen</h2>
          <div className="badge badge-primary badge-lg">{props.transactions.length}</div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <Legend />
            </thead>
            <tbody>
              {props.transactions.map((row) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-base-200/50 transition-colors ${
                    row.canceled ? "opacity-60" : ""
                  }`}
                >
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-base-content/50" />
                        <span className="font-medium">
                          {row.createdAt.toLocaleString("de", localStringOptions)}
                        </span>
                      </div>
                      <span className="text-xs text-base-content/50">ID: {row.id}</span>
                      {row.canceledBy && (
                        <div className="flex items-center gap-1 text-error">
                          <Ban className="h-3 w-3" />
                          <span className="text-xs">Storniert von {row.canceledBy.name}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      row.canceled ? "badge-error" : "badge-info"
                    }`}>
                      {row.canceled && <Ban className="h-3 w-3 mr-1" />}
                      {row.type}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-bold text-lg ${
                        row.canceled 
                          ? "line-through text-base-content/50" 
                          : row.totalAmount && row.totalAmount > 0 
                          ? "text-success" 
                          : "text-error"
                      }`}>
                        {row.totalAmount && row.totalAmount > 0 ? "+" : ""}
                        {row.totalAmount?.toFixed(2)}€
                      </span>
                      {!!row.amountWithoutFees && (
                        <span className="text-xs text-base-content/50">
                          Netto: {row.amountWithoutFees?.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-base-content/50" />
                      <span className="font-medium">{row.user.name}</span>
                    </div>
                  </td>
                  <td>
                    {row.moneyDestination && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-base-content/50" />
                        <span>{row.moneyDestination.name}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {row.clearingAccount && (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-base-content/50" />
                        <span>{row.clearingAccount.name}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {props.transactions.map((row) => (
            <div
              key={row.id}
              className={`card border border-base-300 bg-base-200 shadow-sm ${
                row.canceled ? "opacity-60" : ""
              }`}
            >
              <div className="card-body p-4">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-base-content/50" />
                      <span className="text-sm font-medium">
                        {row.createdAt.toLocaleString("de", localStringOptions)}
                      </span>
                    </div>
                    <span className="text-xs text-base-content/50">ID: {row.id}</span>
                  </div>
                  <span className={`badge ${
                    row.canceled ? "badge-error" : "badge-info"
                  }`}>
                    {row.canceled && <Ban className="h-3 w-3 mr-1" />}
                    {row.type}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center py-2 border-t border-base-300">
                  <span className="text-sm text-base-content/70">Betrag:</span>
                  <div className="flex flex-col items-end">
                    <span className={`font-bold text-xl ${
                      row.canceled 
                        ? "line-through text-base-content/50" 
                        : row.totalAmount && row.totalAmount > 0 
                        ? "text-success" 
                        : "text-error"
                    }`}>
                      {row.totalAmount && row.totalAmount > 0 ? "+" : ""}
                      {row.totalAmount?.toFixed(2)}€
                    </span>
                    {!!row.amountWithoutFees && (
                      <span className="text-xs text-base-content/50">
                        Netto: {row.amountWithoutFees?.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>

                {/* User */}
                <div className="flex justify-between items-center py-2 border-t border-base-300">
                  <span className="text-sm text-base-content/70">Benutzer:</span>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-base-content/50" />
                    <span className="font-medium">{row.user.name}</span>
                  </div>
                </div>

                {/* Destination */}
                {row.moneyDestination && (
                  <div className="flex justify-between items-center py-2 border-t border-base-300">
                    <span className="text-sm text-base-content/70">Ziel:</span>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-base-content/50" />
                      <span>{row.moneyDestination.name}</span>
                    </div>
                  </div>
                )}

                {/* Clearing Account */}
                {row.clearingAccount && (
                  <div className="flex justify-between items-center py-2 border-t border-base-300">
                    <span className="text-sm text-base-content/70">Verrechnungskonto:</span>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-base-content/50" />
                      <span>{row.clearingAccount.name}</span>
                    </div>
                  </div>
                )}

                {/* Canceled Info */}
                {row.canceledBy && (
                  <div className="alert alert-error py-2 mt-2">
                    <Ban className="h-4 w-4" />
                    <span className="text-xs">Storniert von {row.canceledBy.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TransactionList
