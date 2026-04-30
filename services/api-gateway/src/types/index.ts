export interface JwtPayload {
  userId: string
  username: string
  sessionName: string
  sscUrl: string
  iat: number
  exp: number
}
