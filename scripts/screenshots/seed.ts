import "dotenv/config"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../../src/generated/prisma/client"
import { spawnSync } from "node:child_process"
import { rmSync, writeFileSync } from "node:fs"
import path from "node:path"

const defaultScreenshotDatabaseUrl = "file:./screenshots.db"
const databaseUrl = process.env.SCREENSHOT_DATABASE_URL ?? defaultScreenshotDatabaseUrl

const databaseUrlServer = databaseUrl.startsWith("file:./")
  ? `file:./prisma/${databaseUrl.slice("file:./".length)}`
  : databaseUrl;

process.env.DATABASE_URL = databaseUrlServer

if (databaseUrl === defaultScreenshotDatabaseUrl) {
  const databasePath = path.resolve("prisma", "screenshots.db")
  rmSync(databasePath, { force: true })
  rmSync(`${databasePath}-journal`, { force: true })
  writeFileSync(databasePath, "")
}

const prismaCommand =
  process.platform === "win32"
    ? {
        command: process.env.ComSpec ?? "cmd.exe",
        args: ["/d", "/s", "/c", "npx prisma db push --force-reset"],
      }
    : {
        command: "npx",
        args: ["prisma", "db", "push", "--force-reset"],
      }

const push = spawnSync(prismaCommand.command, prismaCommand.args, {
  stdio: "inherit",
  env: process.env,
})

if (push.status !== 0) {
  if (push.error) {
    console.error(push.error)
  }
  process.exit(push.status ?? 1)
}


const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: databaseUrlServer,
  }),
})

const ids = {
  users: ["screenshot-demo-user", "screenshot-user-2", "screenshot-user-3", "screenshot-user-4"],
  account: "screenshot-main-account",
  feesAccount: "screenshot-fees-account",
  categories: ["screenshot-cat-drinks", "screenshot-cat-snacks", "screenshot-cat-lunch"],
  items: [
    "screenshot-item-mate",
    "screenshot-item-chips",
    "screenshot-item-water",
    "screenshot-item-iced-tea",
    "screenshot-item-spezi",
    "screenshot-item-wassereis",
    "screenshot-item-pizza-margherita",
    "screenshot-item-pizza-salami",
    "screenshot-item-pizza-funghi",
    "screenshot-item-pizza-veggie",
  ],
  procurementItems: [
    "screenshot-proc-pizza-margherita",
    "screenshot-proc-pizza-salami",
    "screenshot-proc-pizza-funghi",
    "screenshot-proc-pizza-veggie",
  ],
  groupOrders: ["screenshot-group-open", "screenshot-group-progress"],
} as const

const demoUsers = [
  { id: ids.users[0], name: "Sally Ride", email: "sally.ride@example.com", is_admin: true, allowOverdraw: true, balance: 24.8 },
  { id: ids.users[1], name: "Neil Armstrong", email: "neil.armstrong@example.com", balance: 12.25 },
  { id: ids.users[2], name: "Mae Jemison", email: "mae.jemison@example.com", balance: -3.4, allowOverdraw: true },
  { id: ids.users[3], name: "Yuri Gagarin", email: "yuri.gagarin@example.com", balance: 6.7 },
]

async function deleteDemoData() {
  const demoTransactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { userId: { in: [...ids.users] } },
        { moneyDestinationUserId: { in: [...ids.users] } },
        { groupOrderId: { in: [...ids.groupOrders] } },
      ],
    },
    select: { id: true },
  })
  const demoTransactionIds = demoTransactions.map((transaction) => transaction.id)

  await prisma.itemCategoryMapping.deleteMany({
    where: { transactionId: { in: demoTransactionIds } },
  })
  await prisma.procurementItemBilling.deleteMany({
    where: { transactionId: { in: demoTransactionIds } },
  })
  await prisma.procurementWish.deleteMany({
    where: { OR: [{ userId: { in: [...ids.users] } }, { groupOrderId: { in: [...ids.groupOrders] } }] },
  })
  await prisma.transaction.deleteMany({
    where: {
      OR: [
        { userId: { in: [...ids.users] } },
        { moneyDestinationUserId: { in: [...ids.users] } },
        { groupOrderId: { in: [...ids.groupOrders] } },
      ],
    },
  })
  await prisma.groupOrder.deleteMany({ where: { id: { in: [...ids.groupOrders] } } })
  await prisma.item.deleteMany({ where: { id: { startsWith: "screenshot-item-" } } })
  await prisma.procurementItem.deleteMany({ where: { id: { startsWith: "screenshot-proc-" } } })
  await prisma.category.deleteMany({ where: { id: { in: [...ids.categories] } } })
  await prisma.clearingAccount.deleteMany({ where: { id: { in: [ids.account, ids.feesAccount] } } })
  await prisma.user.deleteMany({ where: { id: { in: [...ids.users] } } })
}

async function seed() {
  await deleteDemoData()

  await prisma.clearingAccount.createMany({
    data: [
      { id: ids.account, name: "LabEats Hauptkasse", balance: 74.5 },
      { id: ids.feesAccount, name: "Kuechen-Fee", balance: 8.2 },
    ],
  })

  await prisma.user.createMany({ data: demoUsers })

  await prisma.category.create({
    data: {
      id: ids.categories[0],
      name: "Getraenke",
      defaultUnfoldedDisplay: true,
      markupPercentage: 0,
      markupFixed: 0,
    },
  })
  await prisma.category.create({
    data: {
      id: ids.categories[1],
      name: "Snacks",
      defaultUnfoldedDisplay: true,
      markupPercentage: 0,
      markupFixed: 0,
    },
  })
  await prisma.category.create({
    data: {
      id: ids.categories[2],
      name: "Mittagessen",
      defaultUnfoldedDisplay: true,
      markupPercentage: 0,
      markupFixed: 0.25,
      markupDestination: { connect: { id: ids.feesAccount } },
    },
  })

  const itemData = [
    { id: ids.items[0], name: "Club Mate", price: 1.2, categories: [ids.categories[0]] },
    { id: ids.items[1], name: "Chips", price: 1.5, categories: [ids.categories[1]] },
    { id: ids.items[2], name: "Mineralwasser", price: 0.7, categories: [ids.categories[0]] },
    { id: ids.items[3], name: "Eistee Pfirsich", price: 1.3, categories: [ids.categories[0]] },
    { id: ids.items[4], name: "Spezi", price: 1.1, categories: [ids.categories[0]] },
    { id: ids.items[5], name: "Wassereis", price: 0.4, categories: [ids.categories[1]] },
    { id: ids.items[6], name: "Pizza Margherita", price: 6.5, categories: [ids.categories[2]], for_grouporders: true },
    { id: ids.items[7], name: "Pizza Salami", price: 7.2, categories: [ids.categories[2]], for_grouporders: true },
    { id: ids.items[8], name: "Pizza Funghi", price: 7.0, categories: [ids.categories[2]], for_grouporders: true },
    { id: ids.items[9], name: "Pizza Veggie", price: 7.4, categories: [ids.categories[2]], for_grouporders: true },
  ]

  for (const item of itemData) {
    await prisma.item.create({
      data: {
        id: item.id,
        canonicalItemId: item.id,
        name: item.name,
        price: item.price,
        for_grouporders: item.for_grouporders ?? false,
        account: { connect: { id: ids.account } },
        categories: { connect: item.categories.map((id) => ({ id })) },
      },
    })
  }

  for (const item of [
    { id: ids.procurementItems[0], name: "Pizza Margherita" },
    { id: ids.procurementItems[1], name: "Pizza Salami" },
    { id: ids.procurementItems[2], name: "Pizza Funghi" },
    { id: ids.procurementItems[3], name: "Pizza Veggie" },
  ]) {
    await prisma.procurementItem.create({
      data: {
        id: item.id,
        name: item.name,
        categories: { connect: [{ id: ids.categories[2] }] },
      },
    })
  }

  const now = new Date()
  const tomorrowNoon = new Date(now)
  tomorrowNoon.setDate(tomorrowNoon.getDate() + 1)
  tomorrowNoon.setHours(12, 30, 0, 0)

  const inProgressDate = new Date(now)
  inProgressDate.setHours(inProgressDate.getHours() - 2)

  await prisma.groupOrder.create({
    data: {
      id: ids.groupOrders[0],
      name: "Freitags-Lunch",
      ordersCloseAt: tomorrowNoon,
      procurementWishes: {
        create: [
          {
            user: { connect: { id: ids.users[1] } },
            items: { connect: [{ id: ids.procurementItems[0] }] },
          },
          {
            user: { connect: { id: ids.users[2] } },
            items: { connect: [{ id: ids.procurementItems[1] }, { id: ids.procurementItems[2] }] },
          },
          {
            user: { connect: { id: ids.users[0] } },
            items: { connect: [{ id: ids.procurementItems[3] }] },
          },
        ],
      },
    },
  })

  await prisma.groupOrder.create({
    data: {
      id: ids.groupOrders[1],
      name: "Abrechnung vom letzten Einkauf",
      ordersCloseAt: inProgressDate,
      ordersClosedAt: now,
      status: 5,
      closedBy: { connect: { id: ids.users[0] } },
      procurementWishes: {
        create: [
          {
            user: { connect: { id: ids.users[3] } },
            items: { connect: [{ id: ids.procurementItems[2] }] },
          },
          {
            user: { connect: { id: ids.users[1] } },
            items: { connect: [{ id: ids.procurementItems[0] }] },
          },
        ],
      },
    },
  })

  const transactionDates = [8, 25, 60, 180].map((minutesAgo) => {
    const date = new Date(now)
    date.setMinutes(date.getMinutes() - minutesAgo)
    return date
  })

  await prisma.transaction.create({
    data: {
      user: { connect: { id: ids.users[0] } },
      type: 0,
      amountWithoutFees: 1.2,
      totalAmount: 1.2,
      createdAt: transactionDates[0],
      clearingAccount: { connect: { id: ids.account } },
      items: {
        create: {
          item: { connect: { id: ids.items[0] } },
          canonicalItemId: ids.items[0],
          categories: { connect: [{ id: ids.categories[0] }] },
        },
      },
    },
  })
  await prisma.transaction.create({
    data: {
      user: { connect: { id: ids.users[0] } },
      moneyDestination: { connect: { id: ids.users[1] } },
      type: 2,
      totalAmount: 4,
      note: "Pizza-Anteil",
      createdAt: transactionDates[1],
    },
  })
  await prisma.transaction.create({
    data: {
      user: { connect: { id: ids.users[2] } },
      moneyDestination: { connect: { id: ids.users[0] } },
      type: 2,
      totalAmount: 10,
      note: "Aufgeladen",
      createdAt: transactionDates[2],
    },
  })
  await prisma.transaction.create({
    data: {
      user: { connect: { id: ids.users[0] } },
      type: 0,
      amountWithoutFees: 1.5,
      totalAmount: 1.5,
      createdAt: transactionDates[3],
      clearingAccount: { connect: { id: ids.account } },
      items: {
        create: {
          item: { connect: { id: ids.items[1] } },
          canonicalItemId: ids.items[1],
          categories: { connect: [{ id: ids.categories[1] }] },
        },
      },
    },
  })
}

try {
  await seed()
  console.log("Seeded screenshot demo data.")
} finally {
  await prisma.$disconnect()
}
