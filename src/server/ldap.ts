import { type User } from "next-auth"
import { env } from "~/env.mjs"
import { Client, type ClientOptions } from "ldapts"
import fs from "node:fs"
import path from "node:path"
import { Tid } from "~/helper/zodTypes"

const ldapCert = fs.readFileSync(path.resolve(process.cwd(), `./LDAP-ca.crt`))
export const clientOptions = {
  url: env.LDAP_URL,
  tlsOptions: {
    ca: [ldapCert],
  },
  strictDN: false,
}

export const getLdapClient = () => {
  return new Client(clientOptions)
}

export const searchUser = (
  username: string | undefined,
  password: string | undefined,
): Promise<User | null> => {
  if (!username || !password) {
    console.log("LDAP: Error: Username or password blank")
    return Promise.resolve(null)
  }
  const safeLdapRegex = /^[\w \.]*$/g
  if (!username.match(safeLdapRegex)) {
    console.log("LDAP injection-attack detected - Nice try : )")
    return Promise.resolve(null)
  }
  return new Promise(async (resolve, reject) => {
    const searchUser = new Client(clientOptions)
    const testClient = new Client(clientOptions)

    console.log(process.cwd())
    try {
      console.info("Starting bind of search-user....")
      await searchUser.bind(env.LDAP_BIND_USER, env.LDAP_BIND_PASSWORT)
      const { searchEntries } = await searchUser.search(env.LDAP_SEARCH_BASE, {
        filter: `(&(objectClass=organizationalPerson)(sAMAccountName=${username}))`,
      })
      if (searchEntries.length === 0 || !searchEntries[0]) {
        throw new Error("User not found")
      }
      const userData = searchEntries[0]
      console.log(`objectSid: ${userData['objectSid']}`)
      console.info("Found User in LDAP")
      console.log("Checking user-credentials against LDAP")
      await testClient.bind(userData.dn, password)
      console.log(`Found UserData: ${JSON.stringify(userData)}`)
      const userID = userData.sAMAccountName
      if (userID === undefined) {
        throw new Error("sAMAccountName not defined")
      }
      console.log(`LDAP bind successful (UserID: ${userID})`)

      let is_admin = false
      // TODO: Admin-Check currently broken
      if (env.LDAP_ADMIN_GROUP) {
        const { searchEntries } = await searchUser.search(env.LDAP_SEARCH_BASE, {
          filter: `(&(objectClass=organizationalPerson)(memberOf=${env.LDAP_ADMIN_GROUP}))`,
        })
        console.log(`Found Admin-users: ${JSON.stringify(searchEntries)}`)
          // if (env.LDAP_ADMIN_GROUP.toLowerCase()) {
          //   is_admin = true
          // }
      }

      const user: User = {
        id: userData.dn,
        name: username,
        is_admin,
      }
      console.log(`Authed user: ${JSON.stringify(user)}`)
      resolve(user)
    } catch (error) {
      console.error("LDAP bind failed - wrong user-credentials?", error)
      resolve(null)
    } finally {
      await searchUser.unbind()
      await testClient.unbind()
    }
  })
}
