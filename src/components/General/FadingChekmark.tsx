import { type NextPage } from "next"
import { useEffect, useState } from "react"
import React from "react"
import { forwardRef, useRef, useImperativeHandle } from "react"

export type AnimationHandle = {
  check: () => void
}

type Props = {}

const FadingCheckmark = forwardRef<AnimationHandle, Props>(
  function FadingCheckmark(props, ref) {
    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => ({
      check() {
        setIsOpen(true)
        setTimeout(() => setIsOpen(false), 2000)
      },
    }))

    return (
      <div className={`${isOpen ? "opacity-100" : "opacity-0"} transition-opacity  duration-500`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    )
  }
)

export default FadingCheckmark
