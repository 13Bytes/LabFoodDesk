import type { NextApiRequest, NextApiResponse } from 'next'
import { getCronRateLimiter } from '~/server/rateLimits'
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
    .then(() => {
      console.log("cron got triggered")
      cronAction().catch((error) => console.error("cron failed", error))
      res.status(200).json({ message: 'cron triggered' })
    })
    .catch(() => {
      // Command already triggered in the last min
      res.status(429).json({ message: 'too many requests' })
    });
}

const cronAction = async () => {
  const now = dayjs()
  const templates = await prisma.groupOrderTemplate.findMany({ where: { active: true }, include: { GroupOrders: true } })
  for (const template of templates) {
    // next deadline of this template (weekday + time)
    let ordersCloseAt = now
      .day(template.weekday)
      .set('hour', template.ordersCloseAt.getHours())
      .set('minute', template.ordersCloseAt.getMinutes())
      .set('second', 0)
      .set('millisecond', 0)
    if (!ordersCloseAt.isAfter(now)) {
      ordersCloseAt = ordersCloseAt.add(7, 'day')
    }
    // create grouporder only within "ordersStartsAt" hours before the deadline
    if (now.isBefore(ordersCloseAt.subtract(template.ordersStartsAt, 'hour'))) {
      continue
    }
    const orderAlreadyCreated = template.GroupOrders.some(groupOrder => groupOrder.ordersCloseAt > now.toDate())
    if (!orderAlreadyCreated) {
      console.debug("creating new grouporder based on template", template.id)
      await prisma.groupOrder.create({
        data: {
          groupOrderTemplateId: template.id,
          ordersCloseAt: ordersCloseAt.toDate(),
          name: template.name,
          filterCategoryId: template.defaultCategoryId,
        }
      })
    }
  }

}
