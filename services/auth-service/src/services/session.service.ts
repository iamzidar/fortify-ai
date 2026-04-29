import Redis from 'ioredis'
import { config } from '../config'

interface SessionData {
  username: string
  sessionName: string
  sscUrl: string
  createdAt: number
}

const redis = new Redis(config.redisUrl)

const SESSION_TTL = 8 * 60 * 60 // 8 hours in seconds

export async function storeSession(sessionId: string, data: SessionData): Promise<void> {
  await redis.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify(data))
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const raw = await redis.get(`session:${sessionId}`)
  if (!raw) return null
  return JSON.parse(raw) as SessionData
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`)
}

export function getRedisClient(): Redis {
  return redis
}
