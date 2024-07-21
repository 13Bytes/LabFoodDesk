import RegularPage from "~/components/Layout/RegularPage"
import CategoryOverview from "~/components/PageComponents/CategoryOverview"
import ClearingAccountOverview from "~/components/PageComponents/ClearingAccountOverview"

const CategoryPage = () => {
  return (
    <RegularPage>
      <div className="flex flex-col gap-4">
       <CategoryOverview />
       <ClearingAccountOverview />
      </div>
    </RegularPage>
  )
}

export default CategoryPage
