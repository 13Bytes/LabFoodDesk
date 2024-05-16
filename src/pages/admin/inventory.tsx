import RegularPage from "~/components/Layout/RegularPage"
import InventoryOverview from "~/components/PageComponents/InventoryOverview"
import ProcurementItemOverview from "~/components/PageComponents/ProcurementItemOverview"

const InventoryPage = () => {

  return (
    <RegularPage>
      <div className="space-y-5">
        <InventoryOverview />
        <ProcurementItemOverview />
      </div>
    </RegularPage>
  )
}

export default InventoryPage
