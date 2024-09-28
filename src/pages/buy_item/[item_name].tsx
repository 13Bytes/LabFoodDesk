import { type NextPage } from "next"
import { useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle, animate } from "~/components/General/ActionResponsePopup"
import BuyItemCardFullscreen from "~/components/General/BuyItemCardFullscreen"
import RegularPage from "~/components/Layout/RegularPage"
import { api } from "~/utils/api"

import { useRouter } from 'next/router';

const BuySingleItemPage: NextPage = () => {
    const router = useRouter()

    const allItemsRequest = api.item.getBuyable.useQuery()
    const animationRef = useRef<AnimationHandle>(null)
    const ItemName = typeof(router.query.item_name)=='string'? router.query.item_name : ""

    const displayedItems = allItemsRequest.data?.filter((item) => {
        return item.name.toLowerCase().includes(ItemName.toLowerCase())
    })

    const apiBuyOneItem = api.item.buyOneItem.useMutation()
    const buyAction = (itemID: string) => {
        apiBuyOneItem.mutate(
            { productID: itemID },
            {
                onError: (error) => {
                    console.error(error)
                    animate(animationRef, "failure", error.message)
                },
                onSuccess: () => {
                    animate(animationRef, "success")
                }
            }
        )
    }
    
    return (
        <RegularPage>
            <div className="flex flex-wrap justify-center gap-2 mt-7 sm:p-4 md:p-7">
                {displayedItems?.map((item) => (
                    <BuyItemCardFullscreen key={item.id} item={item} buyAction={buyAction} />
                ))}
            </div>
        <ActionResponsePopup ref={animationRef} />
        </RegularPage>
    )

}


export default BuySingleItemPage