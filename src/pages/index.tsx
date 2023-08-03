import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const trcpExampleRequestUseAll = api.example.getAll.useQuery();
  const allItemsRequest = api.item.getAll.useQuery();

  return (
    <>
      <Head>
        <title>LabEats</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="primary text-primary">Lab</span> Eats
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              A: {hello.data ? hello.data.greeting : "Loading tRPC query..."}
            </p>
            <AuthButton />
            <p className="text-red-400">
              {allItemsRequest.data?.map((item) => (
                <p key={item.id}>{item.name}</p>
              ))}
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthButton = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as &#34;{sessionData.user?.name}&#34;</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="btn-info btn"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
