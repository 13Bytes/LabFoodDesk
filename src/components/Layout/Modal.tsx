import { type HTMLProps, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

interface Props {
  children: React.ReactNode
  setOpen: (arg: boolean) => void
  open: boolean
  className?: HTMLProps<HTMLElement>["className"]
  closeFunctionCall?: () => void
}

export default function Modal({
  children,
  open,
  setOpen,
  className = "",
  closeFunctionCall = () => {
    // do nothing
  },
}: Props) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!isClient) {
    return null
  }

  return createPortal(
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className={`modal-box ${className}`}>
        <button
          className="btn-ghost btn-sm btn-circle btn absolute right-2 top-2"
          onClick={() => {
            setOpen(false)
            closeFunctionCall()
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </dialog>,
    document.body,
  )
}
