import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { useForm, SubmitHandler } from "react-hook-form"

const Me: NextPage = () => {
  const { data: sessionData } = useSession();

  const trpcUtils = api.useContext();
  const { data: userData, isLoading: userIsLoading } = api.user.getMe.useQuery()
  const updateUser = api.user.updateMe.useMutation()

  type UserFormInput = { name: string }
  const { register: userFormRegister, handleSubmit: handleUserSubmit } = useForm<UserFormInput>()

  const onUserSubmit: SubmitHandler<UserFormInput> = async (data) => {
    const user = updateUser.mutate(data)
    console.log('newUser', user)
    trpcUtils.user.getMe.setData(user, (data) => data)

    // !TODO: why doesn't user contain data from mutation?

    //await trpcUtils.user.getMe.invalidate()
    // console.log('invalidate1')
    // await trpcUtils.user.getMe.refetch()
    // console.log('invalidate2')
  }

  return (
    <div>
      <h1 className="text-4xl">Me</h1>
      {sessionData && JSON.stringify(sessionData)}


      <h2 className="text-xl">user</h2>
      {userData && JSON.stringify(userData)}

      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={handleUserSubmit(onUserSubmit)}>
        <input type="text"
          defaultValue={userData?.name || ""}
          {...userFormRegister("name", { required: true })}
          className="input input-bordered w-full max-w-xs"
        />
        <input type="submit" />
      </form>

      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <button className="btn" onClick={async () => { await trpcUtils.user.getMe.invalidate(); console.log('invalidate') }}>invalidate</button>
    </div >
  );
};

export default Me;
