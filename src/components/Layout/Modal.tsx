interface Props {
  children: React.ReactNode
  setOpen: (arg: boolean) => void
  open: boolean
}

export default function Modal({ children, open, setOpen }: Props) {
  return (
    <dialog className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <button
          className="btn-ghost btn-sm btn-circle btn absolute right-2 top-2"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        {children}
      </div>
    </dialog>
  )
}
