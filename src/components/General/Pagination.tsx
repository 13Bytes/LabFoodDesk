import { ChevronLeft, ChevronRight } from "lucide-react"

export function Pagination(props: {
    page: number
    maxPage: number | undefined
    setPage: React.Dispatch<React.SetStateAction<number>>
    fetchNextPage?: () => Promise<any>
    changePageAction?: (direction: "next" | "previous") => void,
}) {
    const { page, maxPage, setPage, changePageAction, fetchNextPage } = props

    const nextDisabled = maxPage === undefined || page >= maxPage
    return (
        <div className="join grid grid-cols-3 mt-2">
            <button
                className={`btn join-item ${page < 1 ? "btn-disabled" : "btn-outline"} border-r-0`}
                onClick={() => {
                    changePageAction?.("previous")
                    setPage((prev) => prev - 1)
                }}
                disabled={page < 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="btn join-item btn-active pointer-events-none border-1 border-base-content">
                Seite {page + 1}
            </button>
            <button
                className={`btn join-item ${nextDisabled ? "btn-disabled" : "btn-outline"} border-l-0`}
                onClick={() => {
                    void fetchNextPage?.()
                    changePageAction?.("next")
                    setPage((prev) => prev + 1)
                }}
                disabled={nextDisabled}>
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>)
}