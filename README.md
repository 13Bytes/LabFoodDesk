# LabEats
**LabEats allows a group of people to manage money in combination with item-sales, procurement and group-orders in a moderated prepaid fashion.**

A tool to manage (food)(orders) in the Aerospace Lab (an awesome club in Germany).\
It is designed with our club in mind, but can surely be adapted to fit more needs.

<img src="https://github.com/13Bytes/LabFoodDesk/assets/12069002/8f4b9923-0582-4ba9-a53a-ddfaae0f7832" height=500>

<img src="https://github.com/13Bytes/LabFoodDesk/assets/12069002/c91b83b9-cdb1-4d65-b61a-1eb0d3d33fa3" height=500>

<img src="https://github.com/13Bytes/LabFoodDesk/assets/12069002/02562eb3-aefb-4999-a5c3-3569c4be155a" height=500>

## Overview
**"Kaufen":** Allows users to buy items which are already present (e.g. a beverages).

**"Gruppen-Kauf":** Allows users to join a group-order for one fixed event.
After a specified deadline, one user can close the ordering-process (e.g. to buy the pre-ordered amount).
After this, the price of the whole purchase can be split up between the participants in an arbitrary fashion.

**"Split" & "Aufladen":** Allows users to transfer money.\
The system is designed the following:\
There exists a group of trusted users which are allowed to overdraw their accounts.
All other users can only spend their prepaid credit - which they obtain by giving the trusted users money in the real world.

**"Konto":** Every transaction is logged and can be viewed here.

**Admin-Functionality:** 
- Users are authenticated against LDAP (with additional magic links for development).
- All items can have a percentual and/or fixed additional fee which can be tracked on special clearing accounts.
- Users can be compensated for procurement from those special clearing accounts as well as from the "main account"


## Deployment
deployment via [docker compose](https://docs.docker.com/compose/)

- copy `docker-compose.yml` onto the server.\
- copy `.env.example` onto the server and rename it to `.env` - fill in details accordingly.
- `docker compose up -d`

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

Create DB Migrations (for production)
`npx prisma migrate dev`

### Open ToDos
- Gruppen-Wiederholungen
    - cron-trigger an endpoint?
- "stornieren" in Gruppenbestellungen angepasst anzeigen
- money: float -> 100x int
- Logs wer was eingetragen hat
- Android zahlen komma auf tastatur ausgeblendet
#### Nice Improvements:
- Verrechnungkonten global anzeigen
- Kontostand in header
- the check if account is covered is prone to simultaneous requests (the actual credit of course not)
- Stats wie oft man was gekauft
- Geld anfordern (kann von anderem User bestätigt werden)


---

## Questions & Contact

Stuck somewhere? Or you want to adopt LabEats to your needs? \
You can contact me at coding@13bytes.de or create a [issue](https://github.com/13Bytes/LabFoodDesk/issues).