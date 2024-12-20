import { PropsWithChildren } from "react"

type Props = {
  open: boolean
  close: (() => void) | (() => Promise<void>)
  proceed: (() => void) | (() => Promise<void>)
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
          <h3 className="text-lg font-bold">Weiter?</h3>
          {props.children}

          <div className="flex flex-row justify-between">
            <button className="btn btn-outline" onClick={props.close}>
              Abbrechen
            </button>
            <button className="btn btn-primary" onClick={onProceedClick}>
              Weiter
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
