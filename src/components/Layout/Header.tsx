import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { Menu } from "lucide-react"
import { Balance } from "../General/Balance"
import { api } from "~/utils/api"

export default function Header() {
  const { data: sessionData } = useSession()
  const router = useRouter()
  const loggedIn = !!sessionData?.user
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery(undefined, {
    enabled: loggedIn,
  })

  // Helper function to determine if a navigation item should be highlighted
  const isActive = (path: string) => {
    // Handle exact matches for root paths
    if (path === "/" && router.pathname === "/") return true
    if (path !== "/" && router.pathname.startsWith(path)) return true
    return false
  }  // Helper function to get navigation item classes with active state
  const getNavItemClasses = (path: string, baseClasses = "hover:bg-primary hover:text-primary-content transition-colors duration-200 font-medium") => {
    if (path === "/top-up") {
      // Special styling for top-up button - use success colors
      const activeClasses = "bg-success text-success-content"
      return isActive(path) ? `${baseClasses} ${activeClasses}` : baseClasses
    }
    
    const activeClasses = "bg-primary text-primary-content"
    return isActive(path) ? `${baseClasses} ${activeClasses}` : baseClasses
  }

  const navElements = () => (
    <>
      <li>
        <Link href="/buy" className={getNavItemClasses("/buy")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h11M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
          </svg>
          Kaufen
        </Link>
      </li>
      <li>
        <Link href="/grouporders" className={getNavItemClasses("/grouporders")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Gruppen-Kauf
        </Link>
      </li>
      <li>
        <Link href="/split" className={getNavItemClasses("/split")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Split
        </Link>
      </li>
      <li>
        <Link href="/top-up" className={getNavItemClasses("/top-up", "hover:bg-success hover:text-success-content transition-colors duration-200 font-medium")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Aufladen
        </Link>
      </li>
      <li>
        <Link href="/account" className={getNavItemClasses("/account")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Konto
        </Link>
      </li>      {sessionData?.user.is_admin && (
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
            <summary tabIndex={0} className={getNavItemClasses("/admin", "hover:bg-warning hover:text-warning-content transition-colors duration-200 font-medium")}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </summary>
            <ul className="z-[100] bg-base-200 rounded-box shadow-xl border border-base-300 mt-1">
              <li>
                <Link href="/admin/inventory" className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/admin/inventory") ? "bg-base-300 font-semibold" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventar
                </Link>
              </li>
              <li>
                <Link href="/admin/grouporders" className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/admin/grouporders") ? "bg-base-300 font-semibold" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Gruppenbestellungen
                </Link>
              </li>
              <li>
                <Link href="/admin/categories" className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/admin/categories") ? "bg-base-300 font-semibold" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Kategorien
                </Link>
              </li>
              <li>
                <Link href="/admin/clearingAccounts" className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/admin/clearingAccounts") ? "bg-base-300 font-semibold" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Verrechnungskonten
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/admin/users") ? "bg-base-300 font-semibold" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  User-Verwaltung
                </Link>
              </li>
              <li>
                <Link href="/admin/allTransactions" className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/admin/allTransactions") ? "bg-base-300 font-semibold" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Alle Transaktionen
                </Link>
              </li>
            </ul>
          </details>
        </li>
      )}
    </>
  )
  return (
    <div className="navbar bg-base-200 shadow-xl border-b border-base-300">
      {loggedIn && (
        <>
          <div className="navbar-start">
            <div className="dropdown menu-sm">              <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden hover:bg-base-300">
                <Menu className="h-6 w-6" />
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-lg z-[1] mt-3 w-64 rounded-box bg-base-200 p-3 shadow-2xl border border-base-300"
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
              className="btn btn-ghost text-2xl font-extrabold tracking-tight text-white hover:bg-base-300 transition-colors duration-200"
              href="/"
            >
              <span className="text-primary">Lab</span> Eats
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-2 space-x-1">
              {navElements()}
            </ul>
          </div>
        </>
      )}

      {/* UserAccount-Icon (top right) */}
      {loggedIn && (
        <div className="navbar-end pr-6">
          <div className="mr-4">
            <Link href="/account" className="transition-transform duration-200 hover:scale-105">
              <Balance balance={userData?.balance} />
            </Link>
          </div>
          <div className="avatar placeholder dropdown dropdown-end">
            <div
              tabIndex={0}
              className="w-12 cursor-pointer rounded-full bg-primary text-primary-content hover:bg-primary-focus transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <span className="font-semibold text-sm">{getUsernameLetters(sessionData?.user?.name)}</span>
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-[1] w-44 rounded-box bg-base-200 p-3 shadow-2xl border border-base-300 mt-2"
            >              <li>
                <Link className={`hover:bg-base-300 transition-colors duration-200 ${isActive("/me") ? "bg-base-300 font-semibold" : ""}`} href="/me">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </Link>
              </li>
              <li>
                <a 
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="hover:bg-error hover:text-error-content transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Abmelden
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
