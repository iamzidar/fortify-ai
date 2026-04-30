import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'
import { config } from '../config'

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpires,
  } as jwt.SignOptions)
}

export function signRefreshToken(sessionId: string): string {
  return jwt.sign({ sessionId, type: 'refresh' }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpires,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
