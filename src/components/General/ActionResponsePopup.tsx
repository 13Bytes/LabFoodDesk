import {
  type RefObject,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useEffect,
} from "react"
import { CheckCircle, AlertCircle } from "lucide-react"
import { createPortal } from "react-dom"

export type AnimationHandle = {
  success: () => void
  failure: (errorMessage?: string) => void
}

type Status = "failure" | "success"

export const DISPLAY_TIME = 1800

export const animate = (
  handle: RefObject<AnimationHandle | null>,
  status: Status,
  errorMessage?: string
) => {
  if (!handle.current) {
    return
  }
  if (status === "success") {
    handle.current.success()
  } else if (status === "failure") {
    handle.current.failure(errorMessage)
  }
}

const ActionResponsePopup = forwardRef<AnimationHandle, object>(function ActionResponsePopup(
  _props,
  ref
) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<Status>("success")
  const [message, setMessage] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const reset = useCallback(() => {
    setIsOpen(false)
    setMessage("")
  }, [])

  const showPopup = useCallback(
    (newStatus: Status, errorMessage?: string) => {
      setStatus(newStatus)
      setMessage(errorMessage ?? "")
      setIsOpen(true)
      setTimeout(reset, DISPLAY_TIME)
    },
    [reset]
  )

  useImperativeHandle(
    ref,
    () => ({
      success: () => showPopup("success"),
      failure: (errorMessage?: string) => showPopup("failure", errorMessage),
    }),
    [showPopup]
  )

  const IconComponent = status === "success" ? CheckCircle : AlertCircle
  const iconColorClass = status === "success" ? "text-green-500" : "text-red-500"

  if (!isMounted) {
    return null
  }

  return createPortal(
    <dialog
      className={`modal ${
        isOpen ? "modal-open opacity-100" : "opacity-0"
      } transition-opacity duration-500`}
      aria-hidden={!isOpen}
    >
      <div className="modal-box flex max-w-sm flex-shrink flex-col items-center justify-center">
        <IconComponent
          className={`h-40 w-40 ${iconColorClass}`}
          aria-hidden="true"
        />
        {message && <p className="font-semibold text-center mt-4">{message}</p>}
      </div>
    </dialog>,
    document.body,
  )
})

export default ActionResponsePopup
