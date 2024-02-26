import CategoryOverview from "~/components/General/CategoryOverview"
import ClearingAccountOverview from "~/components/General/ClearingAccountOverview"

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
