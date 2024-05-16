import { PropsWithChildren } from "react"

export default function RegularPage(props: PropsWithChildren) {
  return (
    <>
      <div className="p-3">
          {props.children}
      </div>
    </>
  )
}
