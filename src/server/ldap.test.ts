import { expect, test} from 'vitest'
import {getLdapClient, searchUser } from './ldap';
import { vi } from 'vitest'
import { Client } from 'ldapts'
import fs from 'fs';

test('connect to LDAP', async () => {
const url = 'ldaps://ucs.aerospace-lab.intranet:636';
const bindDN = 'CN=testuser.123,OU=ASL-User,DC=aerospace-lab,DC=intranet';
const password = 'xxxxxxx';

const client = new Client({
  url,
  tlsOptions: {
    ca: [fs.readFileSync('LDAP-ca.crt')],
  },
  strictDN: false,
});

let isAuthenticated;
try {
  await client.bind(bindDN, password);
  isAuthenticated = true;
} catch (ex) {
  isAuthenticated = false;
  throw ex
} finally {
  await client.unbind();
}
expect(isAuthenticated).toBe(true)
})