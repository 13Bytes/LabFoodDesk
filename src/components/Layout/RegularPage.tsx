import { PropsWithChildren } from "react"

export default function RegularPage(props: PropsWithChildren) {
  return (
    <>
      <div className="py-3 px-10">
          {props.children}
      </div>
    </>
  )
}
