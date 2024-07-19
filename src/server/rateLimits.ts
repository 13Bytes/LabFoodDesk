import { RateLimiterMemory } from 'rate-limiter-flexible'


export const getCronRateLimiter = new RateLimiterMemory({
  points: 2, // Number of points
  duration: 60, // Per second
});