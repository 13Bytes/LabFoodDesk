import { RefObject, forwardRef, useImperativeHandle, useState } from "react"

export type AnimationHandle = {
  success: () => void
  failure: () => void
}

type Status = "failure" | "success"

export const animate = (handle: RefObject<AnimationHandle>, status: Status) => {
  if(!handle.current){
    return
  }
  if (status === "success") {
    handle.current.success()
  } 
  else if (status === "failure") {
    handle.current.failure()
  }
}

const ActionResponsePopup = forwardRef<AnimationHandle, object>(function ActionResponsePopup(
  props,
  ref
) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<Status>("success")

  useImperativeHandle(ref, () => ({
    success() {
      setStatus("success")
      setIsOpen(true)
      setTimeout(() => setIsOpen(false), 1100)
    },
    failure() {
      setStatus("failure")
      setIsOpen(true)
      setTimeout(() => setIsOpen(false), 1100)
    },
  }))

  return (
    <dialog
      id="modal_1"
      className={`modal ${
        isOpen ? "modal-open opacity-100" : "opacity-0"
      } transition-opacity  duration-500`}
    >
      <div className="center modal-box flex max-w-sm flex-shrink justify-center">
        {status === "success" && (
          <svg
            className="h-40 w-40 text-green-500"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        {status === "failure" && (
          <svg
            className="h-40 w-40 text-red-500"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        )}
      </div>
    </dialog>
  )
})

export default ActionResponsePopup
