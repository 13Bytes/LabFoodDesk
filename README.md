# NAME still not defined
A tool to manage (food)(orders) in the Aerospace Lab.

## ToDo
- generell Möglichkeit Einkäufe zu tätigen (zB Spezi kaufen gehen)
    - procurement: fix api-call so user gets just the money, without any debt elsewhere
- Gruppenbestellung: Kosten einem gutschreiben
- Verrechnungskonto an jemanden Überweisen
- Error-Messages zu allen Forms adden
- Logs wer was eingetragen hat
- Gruppenbestellung bearbeiten
- Gruppen-Wiederholungen
    - cron-trigger an endpoint?
#### Nice Improveents:
- the check if account is covered is prone to simultaneous requests (the actual credit of course not)


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