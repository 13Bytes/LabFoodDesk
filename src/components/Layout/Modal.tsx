interface Props {
  children: React.ReactNode
  setOpen: (arg: boolean) => void
  open: boolean
  className?: string
  closeFunctionCall?: () => void
}

export default function Modal({
  children,
  open,
  setOpen,
  className = "",
  closeFunctionCall = () => {},
}: Props) {
  return (
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
    </dialog>
  )
}
