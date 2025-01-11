import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { MenueIcon } from "../Icons/MenueIcon"
import { Balance } from "../General/Balance"
import { api } from "~/utils/api"

export default function Header() {
  const { data: sessionData } = useSession()
  const loggedIn = !!sessionData?.user
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery(undefined, {
    enabled: loggedIn,
  })

  const navElements = () => (
    <>
      <li>
        <Link href="/buy">Kaufen</Link>
      </li>
      <li>
        <Link href="/grouporders">Gruppen-Kauf</Link>
      </li>
      <li>
        <Link href="/split">Split</Link>
      </li>
      <li>
        <Link href="/top-up">Aufladen</Link>
      </li>
      <li>
        <Link href="/account">Konto</Link>
      </li>
      {sessionData?.user.is_admin && (
        <li>
          <details
            tabIndex={0}
            onBlur={(e) => {
              const target = e.currentTarget
              setTimeout(function () {
                target.open = false
              }, 300)
            }}
          >
            <summary tabIndex={0}>Admin</summary>
            <ul className="z-[100]">
              <li>
                <Link href="/admin/inventory">Inventar</Link>
              </li>
              <li>
                <Link href="/admin/grouporders">Gruppenbestellungen</Link>
              </li>
              <li>
                <Link href="/admin/categories">Kategorien</Link>
              </li>
              <li>
                <Link href="/admin/clearingAccounts">Verrechnungskonten</Link>
              </li>
              <li>
                <Link href="/admin/users">User-Verwaltung</Link>
              </li>
              <li>
                <Link href="/admin/allTransactions">Alle Transaktionen</Link>
              </li>
            </ul>
          </details>
        </li>
      )}
    </>
  )

  return (
    <div className="navbar bg-base-100">
      {loggedIn && (
        <>
          <div className="navbar-start">
            <div className="dropdown menu-sm">
              <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                <MenueIcon />
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-lg z-[1] mt-3 w-60 rounded-box bg-base-100 p-2 shadow-lg"
                onClick={() => {
                  const elem = document.activeElement
                  if (elem) {
                    setTimeout(() => {
                      const elem = document.activeElement
                      if (elem && elem.nodeName !== "SUMMARY") {
                        ;(elem as HTMLInputElement).blur()
                      }
                    }, 100)
                  }
                }}
              >
                {navElements()}
              </ul>
            </div>
            <Link
              className="btn btn-ghost text-xl font-extrabold tracking-tight text-white"
              href="/"
            >
              <span className="primary text-primary">Lab</span> Eats
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">{navElements()}</ul>
          </div>
        </>
      )}

      {/* UserAccount-Icon (top right) */}
      {loggedIn && (
        <div className="navbar-end">
          <div className="text-sm font-thin">
            <li>
              <Link href="/account">
                <Balance balance={userData?.balance} />
              </Link>
            </li> 
          </div>
          <div className="avatar placeholder dropdown dropdown-end ml-3">
            <div
              tabIndex={0}
              className="w-12 cursor-pointer rounded-full bg-base-300 text-neutral-content hover:bg-base-200"
            >
              <span>{getUsernameLetters(sessionData?.user?.name)}</span>
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-[1] w-40 rounded-box bg-base-100 p-2 shadow-lg"
            >
              <li>
                <Link className="avatar placeholder" href="/me">
                  Profil
                </Link>
              </li>
              <li>
                <a onClick={() => void signOut({ callbackUrl: "/" })}>Log OUT</a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
