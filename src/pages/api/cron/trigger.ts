import type { NextApiRequest, NextApiResponse } from 'next'
import { getCronRateLimiter } from '~/server/rateLimits'


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
      // todo: do stuff: e.g.: create group-orders or send notifications
        console.log("cron got triggered")
        res.status(200).json({ message: 'cron triggered' })
      })
      .catch((rateLimiterRes) => {
        // Command already triggered in the last min
        res.status(429).json({ message: 'too many requests' })
    });
}