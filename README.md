# NAME still not defined
A tool to manage (food)(orders) in the Aerospace Lab.

## ToDo
- Ofensteuer (und andere Buffer für zB Spezi)
- Geld überziehen von admins
- Gruppenbestellungen betrag im Nachhinein eingeben
- Logs wer was eingetragen hat


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