import { type User } from "next-auth"
import { env } from "~/env.mjs"
import { Client } from 'ldapts'

export const getLdapClient = () => {
  const ldapClient = new Client({
    url: env.LDAP_URL,
  });
  return ldapClient
}

export const searchUser = (
  ldapClient: Client,
  username: string | undefined,
  password: string | undefined
): Promise<User | null> => {
  if (!username || !password) {
    console.log("LDAP: Error: Username or password blank")
    return Promise.reject()
  }
  return new  Promise(async (resolve, reject) => {
    try{
      console.log("LDAP starting bind")
      await ldapClient.bind(env.LDAP_BIND_USER, env.LDAP_BIND_PASSWORT)
      console.log("LDAP bind successful")

      const { searchEntries, searchReferences } = await ldapClient.search(env.LDAP_SEARCH_BASE, {
        scope: 'sub',
        filter: `(sAMAccountName=${username})`,
      });

      resolve({
        username: username,
        password: password,
        is_admin: false,
        id: "todo",
      } as User)
    }
    catch (error) {
      console.error("LDAP bind failed - wrong user-credentials?", error)
      reject()
    } finally {
      await ldapClient.unbind();
    }
  })
}
