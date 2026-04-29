export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export interface AuthUser {
  id: string
  username: string
  sscUrl: string
  sessionName: string
}

export interface JwtPayload {
  userId: string
  username: string
  sessionName: string
  sscUrl: string
  iat: number
  exp: number
}

export interface RefreshResponse {
  accessToken: string
  expiresIn: number
}
