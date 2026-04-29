import Redis from 'ioredis'
import { config } from '../config'

const redis = new Redis(config.redisUrl)

export async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit) as T
  const value = await fn()
  await redis.setex(key, ttl, JSON.stringify(value))
  return value
}

export async function invalidate(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}
