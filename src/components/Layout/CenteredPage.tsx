import { PropsWithChildren } from "react"

export default function CenteredPage(props: PropsWithChildren) {
  return (
    <>
      <div className="flex max-w-5xl justify-center">
        <div className="bg flex flex-col items-center justify-center sm:p-4 md:p-7">
          {props.children}
        </div>
      </div>
    </>
  )
}
