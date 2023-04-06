require("dotenv").config()
import jwt from "jsonwebtoken"
import 'dotenv/config'
import { Response } from "express"

export const generateAccessToken = (id:string) => {
  if(process.env.ACCESS_TOKEN_SECRET_KEY)
  return jwt.sign({
    id: id
  },
  process.env.ACCESS_TOKEN_SECRET_KEY,
  {expiresIn: "1d"},
  )
} 
export const generateRefreshToken = (id:string) => {
  if(process.env.REFRESH_TOKEN_SECRET_KEY)
  return jwt.sign({
    id: id,
  },
  process.env.REFRESH_TOKEN_SECRET_KEY,
  {expiresIn: "7d"},
  )
}

export const generateNewTokens = (refreshToken:string, id:string, res:Response) => {
  let newAccessToken
  let newRefreshToken 
  if(!process.env.REFRESH_TOKEN_SECRET_KEY) return
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err: jwt.VerifyErrors | null, user: string | jwt.JwtPayload | undefined) => {
    if(err) {
      return res.status(400).json({msg: "invalid refresh token"})
    }
    newAccessToken = generateAccessToken(id)
    newRefreshToken = generateRefreshToken(id)
  })
  return {newAccessToken, newRefreshToken}
}
