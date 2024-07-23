import { Client } from "ldapts"
import { type User } from "next-auth"
import fs from "node:fs"
import path from "node:path"
import { env } from "~/env.mjs"
import { prisma } from "./db"

const ldapCert = fs.readFileSync(path.resolve(process.cwd(), `./LDAP-ca.crt`))
export const clientOptions = {
  url: env.LDAP_URL,
  tlsOptions: {
    ca: [ldapCert],
  },
  strictDN: false,
}

export const manageLdapLogin = (
  username: string | undefined,
  password: string | undefined,
): Promise<User | null> => {
  if (!username || !password) {
    console.log("LDAP: Error: Username or password blank")
    return Promise.resolve(null)
  }
  const safeLdapRegex = /^[\w\.-]*$/g
  if (!username.match(safeLdapRegex)) {
    console.log("LDAP injection-attack detected - Nice try : )")
    return Promise.resolve(null)
  }
  return new Promise(async (resolve) => {
    const searchUser = new Client(clientOptions)
    const testClient = new Client(clientOptions)

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
      console.info("Found User in LDAP")
      console.info("Checking user-credentials against LDAP")
      await testClient.bind(userData.dn, password)
      console.log(`Found UserData: ${JSON.stringify(userData)}`)
      const userID = userData.sAMAccountName
      if (userID === undefined || typeof userID !== "string") {
        throw new Error("sAMAccountName not defined")
      }
      console.log(`LDAP bind successful (UserID: ${userID})`)

      // Admin-Check
      let is_admin = false
      if (env.LDAP_ADMIN_GROUP && userData.memberOf !== undefined) {
        for (const userGroup of userData.memberOf) {
          if (typeof userGroup === "string") {
            if (env.LDAP_ADMIN_GROUP.toLowerCase() === userGroup.toLowerCase()) {
              is_admin = true
            }
          }
        }
      }

      // Check if uidNumber is valid
      const uid = userData.uidNumber
      if (uid == undefined || typeof uid !== "string" || uid.length === 0) {
        throw new Error("uidNumber not defined")
      }

      const upsertedUser = await prisma.user.upsert({
        where: { id: uid },
        update: { name: username, is_admin },
        create: { id: uid, name: username, is_admin },
      })

      console.log(`Authed user: ${JSON.stringify(upsertedUser)}`)
      resolve(upsertedUser)
    } catch (error) {
      console.error("LDAP bind failed - wrong user-credentials?", error)
      resolve(null)
    } finally {
      await searchUser.unbind()
      await testClient.unbind()
    }
  })
}
