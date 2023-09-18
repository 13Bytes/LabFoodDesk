import { Session } from "next-auth"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export default function Header() {
  const { data: sessionData } = useSession()
  const loggedIn = !!sessionData?.user

  const navElements = () => (
    <>
      <li>
        <Link href="/buy">Kaufen</Link>
      </li>
      <li>
        <Link href="/split">Split™️</Link>
      </li>
      <li>
        <Link href="/account">Konto</Link>
      </li>
    </>
  )

  const getUsernameLetters = (sessionData: Session | null) => {
    const name = sessionData?.user?.name
    if (name) {
      const nameSegments = name.trim().split(" ")

      let firstLetter = ""
      let secondLetter = ""
      if (nameSegments.length >= 1) {
        firstLetter = nameSegments[0]![0] || ""
      }
      if (nameSegments.length >= 2) {
        secondLetter = nameSegments[nameSegments.length - 1]![0] || ""
      }
      return (firstLetter + secondLetter).toUpperCase()
    }
    return "?"
  }

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn-ghost btn lg:hidden">
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
                d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5"
              />
            </svg>
          </label>

          <ul
            tabIndex={0}
            className="dropdown-content menu rounded-box menu-lg z-[1] mt-3 w-60 bg-base-100 p-2 shadow"
          >
            {navElements()}
          </ul>
        </div>
        <Link
          className="btn-ghost btn text-xl font-extrabold tracking-tight text-white"
          href="/"
        >
          <span className="primary text-primary">Lab</span> Eats
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{navElements()}</ul>
      </div>
      {/* UserAccount-Icon (top right) */}
      {loggedIn && (
        <div className="navbar-end">
          {/* <Link className="placeholder avatar" href="/me">
            <div className="w-12 rounded-full bg-neutral-focus text-neutral-content">
              <span>{getUsernameLetters(sessionData)}</span>
            </div>
          </Link>
           */}
          <div className="placeholder dropdown-end dropdown avatar">
            <div
              tabIndex={0}
              className="w-12 rounded-full bg-neutral-focus text-neutral-content"
            >
              <span>{getUsernameLetters(sessionData)}</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu rounded-box z-[1] w-40 bg-base-100 p-2 shadow"
            >
              <li>
                <Link className="placeholder avatar" href="/me">
                  Profil
                </Link>
              </li>
              <li>
                <a onClick={() => void signOut({ callbackUrl: "/" })}>
                  Log OUT
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
