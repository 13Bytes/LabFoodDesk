import CategoryOverview from "~/components/PageComponents/CategoryOverview"
import ClearingAccountOverview from "~/components/PageComponents/ClearingAccountOverview"

const CategoryPage = () => {
  return (
    <>
      <div className="flex flex-col p-5">
       <CategoryOverview />
       <ClearingAccountOverview />
      </div>
    </>
  )
}

export default CategoryPage
