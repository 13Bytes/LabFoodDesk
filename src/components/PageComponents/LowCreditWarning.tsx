import { MessageCircleWarning, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { HTMLProps } from "react";
import { ITEM_SECURITY_DEPOSIT } from "~/helper/globalTypes";
import { api } from "~/utils/api";

export default function LowCreditWarning(props: { className?: HTMLProps<HTMLElement>["className"] }) {
    const { data: userData } = api.user.getMe.useQuery()

    if ((userData?.balance ?? 9999) < ITEM_SECURITY_DEPOSIT &&
        !userData?.allowOverdraw) {
        return (
            <div role="alert" className={`alert alert-error ${props.className || ""}`}>
                <MessageCircleWarning className="h-6 w-6" />
                <div>
                    <span className="font-semibold">Dein Account hat nicht genug Guthaben! </span>
                    Lade auf um bei den nächsten Gruppenbestellungen dabei zu sein.
                </div>
            </div>
        )
    }
    else {
        return null
    }
}


export function LowCreditWarningSymbol() {
    const { data: userData } = api.user.getMe.useQuery()

    if ((userData?.balance ?? 9999) < ITEM_SECURITY_DEPOSIT &&
        !userData?.allowOverdraw) {
        return (
            <div className="tooltip tooltip-bottom mr-1" data-tip="Dein Account hat nicht genug Guthaben!">
                <Link href="/account" className="transition-transform duration-200 hover:scale-105">
                    <TriangleAlert className="text-red-700" />
                </Link>
            </div>
        )
    }
    else {
        return null
    }
}
