import { HTMLProps, type PropsWithChildren, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

type Props = {
  open: boolean
  close: (() => void) | (() => Promise<void>)
  proceed: (() => void) | (() => Promise<void>)
  title?: string
  cancelText?: string
  proceedText?: string
  proceedButtonClass?: string
  className?: HTMLProps<HTMLElement>["className"]
}
export const ConfirmationModal = (props: PropsWithChildren<Props>) => {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  const onProceedClick = () => {
    props.close()
    props.proceed()
  }

  if (!isClient) {
    return null
  }

  return createPortal(
    <>
      <dialog
        className={`modal ${props.open ? "modal-open" : ""}`}
      >
        <div className={`modal-box {${props.className}}`}>
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={props.close}
            >
              ✕
            </button>
          </form>
          <h3 className="text-lg font-bold mb-4">{props.title ?? "Weiter?"}</h3>
          <div className="py-2">
            {props.children}
          </div>

          <div className="flex flex-row justify-between mt-6">
            <button className="btn btn-outline" onClick={props.close}>
              {props.cancelText ?? "Abbrechen"}
            </button>
            <button 
              className={props.proceedButtonClass ?? "btn btn-primary"} 
              onClick={onProceedClick}
            >
              {props.proceedText ?? "Weiter"}
            </button>
          </div>
        </div>
      </dialog>
    </>,
    document.body,
  )
}
