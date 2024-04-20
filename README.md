# NAME still not defined
A tool to manage (food)(orders) in the Aerospace Lab.

## ToDo
- Error-Messages zu allen Forms adden
- Error-Message bei
    - overdraw-kauf
    - overdraw gruppenbestellung
- Gruppenbestellung bearbeiten
- Undo bei kauf
- LDAP-integration
- Logs wer was eingetragen hat
- Android zahlen komma auf tastatur ausgeblendet
- Konto-History etwas übersichtlicher: überweisungen an wen / von wem anzeigen
- Gruppen-Wiederholungen
    - cron-trigger an endpoint?
#### Nice Improvements:
- Verrechnungkonten global anzeigen
- Kontostand in header
- Gruppenbestellung: was bestellt anzeigen.
- the check if account is covered is prone to simultaneous requests (the actual credit of course not)
- Stats wie oft man was gekauft
- Geld anfordern (kann von anderem User bestätigt werden)


## Development
This is a NextJS project. Some file-conventions apply.

Start Developing:
`npm run dev`

Update types based on current schema:
`npx prisma generate`
- Create TS (prisma) types `import { prisma } from "~/server/db"`
- Creates zod-schemas in `import { mySchema } from '/prisma/generated/zod';`

Update dev-db (might lose data)
`npx prisma db push`

Migrate DB
`npx prisma migrate dev`