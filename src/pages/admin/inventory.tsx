import { useState } from "react"
import ItemForm from "~/components/Forms/ItemForm"
import ProcurementItemForm from "~/components/Forms/ProcurementItemForm"
import { CloseWindowIcon } from "~/components/Icons/CloseWindowIcon"
import Modal from "~/components/Layout/Modal"
import { api } from "~/utils/api"
import InventoryOverview from "~/components/PageComponents/InventoryOverview"
import ProcurementItemOverview from "~/components/PageComponents/ProcurementItemOverview"

const InventoryPage = () => {
  const allItemsRequest = api.item.getAll.useQuery()
  const allProcurementItemsRequest = api.item.getAllProcurementItems.useQuery()
  const [openAddItemModal, setOpenAddItemModal] = useState(false)
  const [openAddProcurementItemModal, setOpenAddProcurementItemModal] = useState(false)

  const trpcUtils = api.useContext()

  const LegendProc = () => (
    <tr>
      <th></th>
      <th>Name</th>
      <th>Kategorie(n)</th>
      <th></th>
    </tr>
  )

  return (
    <>
      <InventoryOverview />
      <ProcurementItemOverview />
    </>
  )
}

export default InventoryPage
