import {
  Archive,
  CreditCard,
  DollarSign,
  FileText,
  LogOut,
  Menu,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingCart,
  User,
  UserCog,
  Users,
  TriangleAlert
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { getUsernameLetters } from "~/helper/generalFunctions"
import { api } from "~/utils/api"
import { Balance } from "../General/Balance"
import { LowCreditWarningSymbol } from "../PageComponents/LowCreditWarning"

export default function Header() {
  const { data: sessionData } = useSession()
  const router = useRouter()
  const loggedIn = !!sessionData?.user
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery(undefined, {
    enabled: loggedIn,
  })

  const isActive = (path: string) => {
    // Handle exact matches for root paths
    if (path === "/" && router.pathname === "/") return true
    if (path !== "/" && router.pathname.startsWith(path)) return true
    return false
  }
  const getNavItemClasses = (
    path: string,
    baseClasses = "hover:bg-primary hover:text-primary-content transition-colors duration-200 font-medium",
  ) => {
    if (path === "/top-up") {
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
          <ShoppingCart className="h-4 w-4" />
          Kaufen
        </Link>
      </li>
      <li>
        <Link href="/grouporders" className={getNavItemClasses("/grouporders")}>
          <Users className="h-4 w-4" />
          Gruppen-Kauf
        </Link>
      </li>
      <li>
        <Link href="/split" className={getNavItemClasses("/split")}>
          <DollarSign className="h-4 w-4" />
          Split
        </Link>
      </li>
      <li>
        <Link
          href="/top-up"
          className={getNavItemClasses(
            "/top-up",
            "font-medium transition-colors duration-200 hover:bg-success hover:text-success-content",
          )}
        >
          <Plus className="h-4 w-4" />
          Aufladen
        </Link>
      </li>
      <li>
        <Link href="/account" className={getNavItemClasses("/account")}>
          <Settings className="h-4 w-4" />
          Konto
        </Link>
      </li>{" "}
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
            <summary
              tabIndex={0}
              className={getNavItemClasses(
                "/admin",
                "font-medium transition-colors duration-200 hover:bg-warning hover:text-warning-content",
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </summary>
            <ul className="z-[100] mt-1 rounded-box border border-base-300 bg-base-200 shadow-xl">
              <li>
                <Link
                  href="/admin/inventory"
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/admin/inventory") ? "bg-base-300 font-semibold" : ""}`}
                >
                  <Package className="h-4 w-4" />
                  Inventar
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/grouporders"
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/admin/grouporders") ? "bg-base-300 font-semibold" : ""}`}
                >
                  <Users className="h-4 w-4" />
                  Gruppenbestellungen
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/categories"
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/admin/categories") ? "bg-base-300 font-semibold" : ""}`}
                >
                  <Archive className="h-4 w-4" />
                  Kategorien
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/clearingAccounts"
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/admin/clearingAccounts") ? "bg-base-300 font-semibold" : ""}`}
                >
                  <CreditCard className="h-4 w-4" />
                  Verrechnungskonten
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/admin/users") ? "bg-base-300 font-semibold" : ""}`}
                >
                  <UserCog className="h-4 w-4" />
                  User-Verwaltung
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/allTransactions"
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/admin/allTransactions") ? "bg-base-300 font-semibold" : ""}`}
                >
                  <FileText className="h-4 w-4" />
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
    <div className="navbar border-b border-base-300 bg-base-200 shadow-xl">
      {loggedIn && (
        <>
          <div className="navbar-start">
            <div className="dropdown menu-sm">
              {" "}
              <div tabIndex={0} role="button" className="btn btn-ghost hover:bg-base-300 lg:hidden">
                <Menu className="h-6 w-6" />
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-lg z-[1] mt-3 w-64 rounded-box border border-base-300 bg-base-200 p-3 shadow-2xl"
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
              className="btn btn-ghost text-2xl font-extrabold tracking-tight text-white transition-colors duration-200 hover:bg-base-300"
              href="/"
            >
              <span className="text-primary">Lab</span> Eats
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal space-x-1 px-2">{navElements()}</ul>
          </div>
        </>
      )}

      {/* UserAccount-Icon (top right) */}
      {loggedIn && (
        <div className="navbar-end pr-6 lg:gap-0">
          <LowCreditWarningSymbol />
          <div className="mr-4">
            <Link href="/account" className="transition-transform duration-200 hover:scale-105">
              <Balance balance={userData?.balance} />
            </Link>
          </div>
          <div className="avatar placeholder dropdown dropdown-end">
            <div
              tabIndex={0}
              className="hover:bg-primary-focus w-12 cursor-pointer rounded-full bg-primary text-primary-content shadow-lg transition-all duration-200 hover:scale-105"
            >
              <span className="text-sm font-semibold">
                {getUsernameLetters(sessionData?.user?.name)}
              </span>
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-[1] mt-2 w-44 rounded-box border border-base-300 bg-base-200 p-3 shadow-2xl"
            >
              {" "}
              <li>
                <Link
                  className={`transition-colors duration-200 hover:bg-base-300 ${isActive("/me") ? "bg-base-300 font-semibold" : ""}`}
                  href="/me"
                >
                  <User className="h-4 w-4" />
                  Profil
                </Link>
              </li>
              <li>
                <a
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="transition-colors duration-200 hover:bg-error hover:text-error-content"
                >
                  <LogOut className="h-4 w-4" />
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
