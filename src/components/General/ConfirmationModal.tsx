import { PropsWithChildren } from "react"

type Props = {
  open: boolean
  close: (() => void) | (() => Promise<void>)
  proceed: (() => void) | (() => Promise<void>)
  title?: string
  cancelText?: string
  proceedText?: string
  proceedButtonClass?: string
}
export const ConfirmationModal = (props: PropsWithChildren<Props>) => {
  const onProceedClick = () => {
    props.close()
    props.proceed()
  }

  return (
    <>
      <dialog className={`modal ${props.open ? "modal-open" : ""}`}>
        <div className="modal-box">
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
    </>
  )
}
