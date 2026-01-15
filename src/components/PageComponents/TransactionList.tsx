import { api, RouterInputs, RouterOutputs } from "~/utils/api"
import { Receipt, User, Target, Wallet, Calendar, Ban, AlertCircle } from "lucide-react"
import { localStringOptions } from "~/helper/globalTypes"
import CSVParser from 'papaparse';
import { useState } from "react";
import { toFlatPropertyMap } from "~/helper/generalFunctions";

type TransactionData = RouterOutputs["transaction"]["getAllInfinite"]["items"]
type Timespans = RouterInputs["transaction"]["getAllFixedTimespan"]["timespan"]
type Props = {
  transactions: TransactionData | undefined
}

const getTransactionTypeLabel = (type: number): string => {
  switch (type) {
    case 0:
      return "Kauf"
    case 1:
      return "Verkauf"
    case 2:
      return "Überweisung"
    case 3:
      return "Beschaffung"
    case 90:
      return "Stornierter Kauf"
    case 91:
      return "Stornierter Verkauf"
    default:
      return `Unbekannt (${type})`
  }
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



  const [queryDuration, setQueryDuration] = useState<Timespans>()
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading'>('idle')
  const { refetch, status } = api.transaction.getAllFixedTimespan.useQuery({ timespan: queryDuration! }, {
    onSuccess: (data) => {
      console.log("converting to csv")
      const flatData = data.map((item) => toFlatPropertyMap(item))
      const csv = CSVParser.unparse(flatData, { delimiter: ';', skipEmptyLines: true })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-16;' })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank");
    },
    onSettled: () => {
      setExportStatus('idle')
      setQueryDuration(undefined)
    },
    enabled: !!queryDuration,
  })

  const startExport = (duration: Timespans) => {
    setQueryDuration(duration)
    setExportStatus('loading')
  }

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
    <div className="card border border-base-300 bg-base-100 shadow-xl w-full max-w-xl lg:max-w-full">
      <div className="card-body p-6 w-full">
        {/* Header Section */}
        <div className="mb-6 flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-base-content">Transaktionen</h2>
          <div className="grow" />
          <div>
            <div className="dropdown dropdown-end dropdown-hover">
              {exportStatus !== 'loading' && <>
                <div tabIndex={0} role="button" className="btn btn-sm">Export...</div>
                <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-10 w-32 shadow-sm">
                  <li><a onClick={() => startExport('week')}>1 Woche</a></li>
                  <li><a onClick={() => startExport('month')}>1 Monat</a></li>
                  <li><a onClick={() => startExport('quarter')}>3 Monate</a></li>
                  <li><a onClick={() => startExport('year')}>1 Jahr</a></li>
                </ul>
              </>}
              {exportStatus === 'loading' && <div role="button" className="btn btn-sm btn-disabled">Export...</div>}
            </div>
          </div>
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
                      {getTransactionTypeLabel(row.type)}
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
        <div className="lg:hidden space-y-4 flex flex-col w-full">
          {props.transactions.map((row) => (
            <div
              key={row.id}
              className={`card flex flex-grow border border-base-300 bg-base-200 shadow-sm ${
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
                    {getTransactionTypeLabel(row.type)}
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
