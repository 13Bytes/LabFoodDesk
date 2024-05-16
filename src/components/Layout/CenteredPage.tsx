import { PropsWithChildren } from "react"
import RegularPage from "./RegularPage"

export default function CenteredPage(props: PropsWithChildren) {
  return (
    <RegularPage>
      <div className="justify-center">
        <div className="bg flex flex-col items-center justify-center sm:p-4 md:p-7">
          {props.children}
        </div>
      </div>
    </RegularPage>
  )
}
