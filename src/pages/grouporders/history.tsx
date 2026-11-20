import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useRef, useState } from "react"
import ActionResponsePopup, {
  type AnimationHandle,
  animate,
} from "~/components/General/ActionResponsePopup"
import { ConfirmationModal } from "~/components/General/ConfirmationModal"
import CenteredPage from "~/components/Layout/CenteredPage"
import { canRevertGroupOrder } from "~/helper/generalFunctions"
import { localStringOptions } from "~/helper/globalTypes"
import { type Tid } from "~/helper/zodTypes"
import { api } from "~/utils/api"

const GroupOrdersHistory: NextPage = () => {
  const trpcUtils = api.useUtils()
  const grouporderRevertClosed = api.groupOrders.revertClosed.useMutation()
  const groupOrdersLatelyClosed = api.groupOrders.getLatelyClosed.useQuery()
  const router = useRouter()

  const animationRef = useRef<AnimationHandle>(null)
  const sessionData = useSession().data

  const [annulateOrderConfirmation, setAnnulateOrderConfirmation] = useState<Tid>()

  const annulateCurrentGroupOrder = async (orderId: Tid) => {
    await grouporderRevertClosed.mutateAsync(
      { groupId: orderId! },
      {
        onError: (error) => {
          animate(animationRef, "failure", error.message)
        },
        onSuccess: async () => {
          animate(animationRef, "success")
          await trpcUtils.groupOrders.invalidate()
          setTimeout(() => router.push("/grouporders"), 1800)
        },
      },
    )
  }

  return (
    <>
      <CenteredPage>
        <div className="container">
          {groupOrdersLatelyClosed.data?.map((group) => (
            <div key={group.id} className="container">
              <div key={group.id} className="card mx-auto mb-5 max-w-5xl border border-base-300 dither bg-linear-to-br from-base-100 to-base-200 p-3 shadow-sm">
                <div className="flex  flex-col justify-start gap-1 p-1">
                  <div className="flex flex-row items-end justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">{group.name}</h1>
                      <p className="mt-1 mb-3 text-sm text-base-content/70">
                        Einkauf: <span className="font-semibold">{group.shopper?.name ?? "unbekannt"}</span>
                      </p>
                    </div>
                    <p className="text-md font-bold">
                      {group.ordersCloseAt.toLocaleString("de", localStringOptions)}
                    </p>
                  </div>

                  {group.orders.some((transaction) => transaction.type < 3 && transaction.procurementItems.length > 0) && (
                    <div className="overflow-x-auto">
                      <div className="divider text-sm text-base-content/60">Gruppen-Artikel</div>
                      <table className="table table-zebra table-sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Artikel</th>
                            <th>Preis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.orders
                            .filter((transaction) => transaction.type < 3 && transaction.procurementItems.length > 0)
                            .map((transaction) => (
                              <tr key={transaction.id}>
                                <td>
                                  <p className="font-semibold">{transaction.user.name}</p>
                                </td>
                                <td>{transaction.procurementItems.map((item) => item.item.name).join(", ")}</td>
                                <td>{transaction.totalAmount.toFixed(2)}€</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {group.orders.some((transaction) => transaction.type < 3 && transaction.items.length > 0) && (
                    <div className="overflow-x-auto">
                      <div className="divider text-sm text-base-content/60">Einzel-Artikel</div>
                      <table className="table table-zebra table-sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Artikel</th>
                            <th>Preis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.orders
                            .filter((transaction) => transaction.type < 3 && transaction.items.length > 0)
                            .map((transaction) => (
                              <tr key={transaction.id}>
                                <td>
                                  <p className="font-semibold">{transaction.user.name}</p>
                                </td>
                                <td>{transaction.items.map((item) => item.item.name).join(", ")}</td>
                                <td>{transaction.totalAmount.toFixed(2)}€</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-between px-3">
                    <div className="flex ">
                      {canRevertGroupOrder(
                        sessionData?.user,
                        group.closedById,
                        group.orders.find((order) => order.type === 3 && !order.canceled)?.createdAt,
                      ) && (
                        <button
                          className="btn btn-primary btn-sm mr-4 mt-1"
                          onClick={() => {
                            setAnnulateOrderConfirmation(group.id)
                          }}
                        >
                          Abrechung annullieren
                        </button>
                      )}
                    </div>
                    <div className="flex">
                      <div className="flex flex-col items-end">
                        {!!group.revertedBy && (
                          <p className="text-sm text-red-500">
                            Frühere Abrechnung Storniert von{" "}
                            <span className="font-bold">{group.revertedBy?.name}</span>
                          </p>
                        )}
                        <p className="text-xs">
                          Abgerechnet durch{" "}
                          <span className="font-semibold">{group.closedBy?.name}</span>
                        </p>
                        <p className="text-xs">
                          Gutschrift an{" "}
                          <span className="font-semibold">
                            {group.orders.find((order) => order.type === 3)?.moneyDestination
                              ?.name ?? "LabEats"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CenteredPage>

      <ConfirmationModal
        open={!!annulateOrderConfirmation}
        proceed={async () => await annulateCurrentGroupOrder(annulateOrderConfirmation!)}
        close={() => setAnnulateOrderConfirmation(undefined)}
      >
        <p className="py-4">
          <span className="font-bold">GANZE</span> Abrechung der Gruppenbestellung rückgängig
          machen?
        </p>
      </ConfirmationModal>
      <ActionResponsePopup ref={animationRef} />
    </>
  )
}

export default GroupOrdersHistory
