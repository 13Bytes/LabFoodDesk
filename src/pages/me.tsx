import { NextPage } from "next"
import Head from "next/head"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api"
import { useForm, SubmitHandler } from "react-hook-form"
import { time } from "console"
import CenteredPage from "~/components/Layout/CenteredPage"

const Me: NextPage = () => {
  const { data: sessionData, update: updateSession } = useSession()

  const trpcUtils = api.useContext()
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()
  const updateUser = api.user.updateMe.useMutation()

  type UserFormInput = { name: string }
  const { register: userFormRegister, handleSubmit: handleUserSubmit } =
    useForm<UserFormInput>()

  const onUserSubmit: SubmitHandler<UserFormInput> = async (data) => {
    console.log("updateUser")
    const user = await updateUser.mutateAsync(data)
    console.log("updateUser finished: newUser", user)

    await trpcUtils.user.getMe.setData(undefined, user)
    updateSession()
  }

  return (
    <CenteredPage>
      <form onSubmit={handleUserSubmit(onUserSubmit)} className="gap-1">
        <p className="font-semibold">Mein Username:</p>
        <div className="mt-1">
        <input
          type="text"
          defaultValue={userData?.name || ""}
          {...userFormRegister("name", { required: true })}
          className="input-bordered input w-full max-w-xs"
          />
          </div>
        <button className="btn mt-1" type="submit">
          Speichern
        </button>
      </form>

      <div className="pt-10">
        <p className="font-bold">Debugging sessionData</p>
        {sessionData && JSON.stringify(sessionData)}

        <p className="font-bold">Debugging userData</p>
        {userData && JSON.stringify(userData)}
      </div>
    </CenteredPage>
  )
}

export default Me
