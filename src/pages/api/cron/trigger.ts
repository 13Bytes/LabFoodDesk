import type { NextApiRequest, NextApiResponse } from 'next'
import { getCronRateLimiter } from '~/server/rateLimits'
import { api } from '~/utils/api'
import { prisma } from "~/server/db"
import dayjs from 'dayjs'

const rateLimiter = getCronRateLimiter

type ResponseData = {
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  rateLimiter.consume("alwaysSameIdentifier")
    .then((rateLimiterRes) => {
      console.log("cron got triggered")
      cronAction()
      res.status(200).json({ message: 'cron triggered' })
    })
    .catch((rateLimiterRes) => {
      // Command already triggered in the last min
      res.status(429).json({ message: 'too many requests' })
    });
}

const cronAction = async () => {
  const DAYS_IN_ADVANCE = 3
  const date = new Date()
  const templates = await prisma.groupOrderTemplate.findMany({ where: { active: true }, include: { GroupOrders: true } })
  for (const template of templates) {
    const runWeekday = template.weekday - 3 < 0 ? template.weekday - DAYS_IN_ADVANCE + 7 : template.weekday - DAYS_IN_ADVANCE
    if (runWeekday === date.getDay()) {
      const orderAlreadyCreated = template.GroupOrders.some(groupOrder => groupOrder.ordersCloseAt > date)
      if (!orderAlreadyCreated) {
        console.debug("creating new grouporder based on template", template.id) 
        const ordersCloseAt = dayjs().add(DAYS_IN_ADVANCE, 'day')
          .set('hour', template.ordersCloseAt.getHours())
          .set('minute', template.ordersCloseAt.getMinutes())
          .set('second', 0)
          .toDate()
        await prisma.groupOrder.create({
          data: {
            groupOrderTemplateId: template.id,
            ordersCloseAt,
            name: template.name,
          }
        })
      }
    }
  }

}