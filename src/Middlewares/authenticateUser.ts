import 'dotenv/config'
import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

interface RequestWithUser extends Request {
  user?: string
}

export const verifyUser = (req:RequestWithUser,res:Response,next:NextFunction) => {
  const authHeader = req.headers.authorization
  if(authHeader){
  const token = authHeader.split(" ")[1]
  if(process.env.ACCESS_TOKEN_SECRET_KEY)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, async(err: jwt.VerifyErrors | null, user: any)=>{
    if (err){
      console.log(err)
      return res.status(403).json({data: "token invalid"})
    }
    if(user && "id" in user){
      req.user = user.id
    }
    next();
  })
    }else{
      res.status(401).json({data: "unAuthenticated"})
    }
}

