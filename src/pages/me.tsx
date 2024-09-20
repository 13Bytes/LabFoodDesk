import { NextPage } from "next"
import { useSession } from "next-auth/react"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import CenteredPage from "~/components/Layout/CenteredPage"
import { api } from "~/utils/api"

const Me: NextPage = () => {
  const { data: sessionData, update: updateSession } = useSession()

  const trpcUtils = api.useUtils()
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()

  type UserFormInput = { name: string }
  const { register: userFormRegister, handleSubmit: handleUserSubmit } = useForm<UserFormInput>()

  // const updateUser = api.user.updateMe.useMutation()
  // const onUserSubmit: SubmitHandler<UserFormInput> = async (data) => {
  //   const user = await updateUser.mutateAsync(data)

  //   trpcUtils.user.getMe.setData(undefined, user)
  //   await updateSession()
  //   return
  // }

  return (
    <CenteredPage>
      {/* <form onSubmit={handleUserSubmit(onUserSubmit)} className="gap-1">
        <p className="font-semibold">Mein Username:</p>
        <div className="mt-1">
          <input
            type="text"
            disabled 
            defaultValue={userData?.name || ""}
            {...userFormRegister("name", { required: true })}
            className="input-bordered input w-full max-w-xs disabled"
          />
        </div>
        <button className="btn mt-1" type="submit">
          Speichern
        </button>
      </form> */}

      <div className="flex flex-col items-center">
        <p className="font-semibold">Username</p>
        <div className="mt-1">
          <input
            type="text"
            disabled
            defaultValue={userData?.name || ""}
            {...userFormRegister("name", { required: true })}
            className="disabled input input-bordered w-full max-w-xs"
          />
        </div>
      </div>
      <details className="collapse mt-10">
        <summary className="collapse-title  text-sm font-thin">Debugging infos</summary>
        <div className="collapse-content">
          <p className="font-bold">Debugging sessionData</p>
          {sessionData && JSON.stringify(sessionData)}

          <p className="font-bold">Debugging userData</p>
          {userData && JSON.stringify(userData)}
        </div>
      </details>
    </CenteredPage>
  )
}

export default Me
