import { type NextPage } from "next"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import ActionResponsePopup, { AnimationHandle } from "~/components/General/ActionResponsePopup"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const TopUp: NextPage = () => {
 
  return (
    <>
      <CenteredPage>
        <h3 className="self-start text-xl">Geld einzahlen</h3>
        <p className="font-bold">Ideen, was der beste Weg ist?</p>
       
      </CenteredPage>
    </>
  )
}

export default TopUp
