import express from "express";
require("dotenv").config()
import { verifyPassword, generateHash } from "./Config/Password_Config";
import * as crypto from "crypto"
import { Request, Response } from "express"
import { User } from "./mongooseSchema";
import { generateAccessToken, generateRefreshToken, generateNewTokens } from "./utils/Verify";
import { verifyUser } from "./Middlewares/authenticateUser";
import multer from "multer"
import { deleteFilesAfterUpload, deleteOldFiles, uploadFile } from "./utils/aws_s3";
import { getUserInfoWithGoogle } from "./utils/google";
const upload = multer({dest: "uploads/"})


interface RegisterBodyInterface {
  username: string,
  email: string,
  password: string
}
interface LoginBodyInterface {
  email: string,
  password: string
}
interface ProcessedBookInterface {
  name: string,
  id: string,
  author: string,
  rating: number,
  pdfFile?: string[],
  dateAdded: string,
  categories: string[],
  imgFile: string[],
  link?: string,
  numberOfPages: string,
  ISBN?: string,
  description: string,
  isFavourite: boolean
}


export const router = express.Router()


router.post("/register", async(req:Request, res:Response)=>{
  const { username, email, password }:RegisterBodyInterface = req.body
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = generateHash(password, salt)

  try {
    const usedEmail = await User.findOne({email})
    if(usedEmail){
      return res.status(400).send("Email has already been used, login")
    }

    await User.create({
      username,
      email,
      salt,
      hash,
      books: [],
      categories: ["Comedy", "Entertainment", "Wealth"]
    })

    const user = await User.findOne({email})
    console.log(user)
    if (!user) return

    const {id} = user

    const accessToken = generateAccessToken(id)
    const refreshToken = generateRefreshToken(id)

    res.json({
      accessToken,
      refreshToken,
      username
    })

  } catch (error) {
    res.status(500).send("something went wrong")
  }
})


router.post("/login", async(req:Request, res:Response)=>{

  const { email, password }:LoginBodyInterface = req.body

  try {
    const user = await User.findOne({email})
    if(!user){
      res.status(400).send("Couldn't find user")
      console.log("Couldn't find user")
      return
    }
  
    const {salt, hash, id, username, books, categories} = user
    if(!salt || !hash)return res.status(500).send("an error occurred, try again")
    const isPasswordValid = verifyPassword(password,hash,salt)
  
    if(!isPasswordValid){
      res.json(400).send("Incorrect password")
      return
    }
  
    const accessToken = generateAccessToken(id)
    const refreshToken = generateRefreshToken(id)
  
    res.json({
      accessToken,
      refreshToken,
      username,
      books,
      categories
    })
  
  } catch (error) {
    res.status(500).send("An error occurred")
  }
  
})

router.post("/registerGoogle", async(req, res)=>{
  const { code, username, password } = req.body

  const salt = crypto.randomBytes(16).toString("hex")
  const hash = generateHash(password, salt)

  getUserInfoWithGoogle(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI_REGISTER!,
    code
  )
  .then(async(userData)=>{
    const existingUser = await User.findOne({email: userData.email})

    if(existingUser) {
      return res.status(400).json({msg: "email has been used please login"}); 
    }

    await User.create({
      username,
      email: userData.email,
      salt,
      hash,
      books: [],
      categories: ["Comedy", "Entertainment", "Wealth"]
    })

    const user = await User.findOne({email: userData.email})

      const id:string = user?.id
      const accessToken = generateAccessToken(id)
      const refreshToken = generateRefreshToken(id)

      res.json({
        username,
        email: userData.email,
        accessToken,
        refreshToken,
    })
  })
  .catch(err => console.log(err))
})

router.post("/loginGoogle", async(req,res) => {
  const { code } = req.body
  try {
    const userData = await getUserInfoWithGoogle(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI_LOGIN!,
    code
  )

    const existingUser = await User.findOne({email: userData.email})

    if(!existingUser){
      return res.status(400).json({msg: "user not found"})
    }
    const { id,books, categories, username } = existingUser
    const accessToken = generateAccessToken(id)
    const refreshToken = generateRefreshToken(id)
    res.json({
      username,
      email: userData.email,
      accessToken,
      refreshToken,
      books,
      categories
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: "couldn't login with google"})
  }
  
})

router.get("/user",verifyUser, async(req:RequestWithUser, res)=>{
  const userId = req.user
  const user = await User.findOne({_id: userId})
  if(!user)return
  res.json({
    username: user.username,
    books: user.books,
    categories: user.categories
  })
})

router.post("/newAccessToken", async(req,res) => {
  const {refreshToken, email} = req.body
  try {
    const user = await User.findOne({email})
    if(!user)return
    const { books, categories, username } = user
    const tokens = generateNewTokens(refreshToken, user.id, res)
    res.json({
      accessToken: tokens?.newAccessToken,
      refreshToken: tokens?.newRefreshToken,
      books,
      categories,
      username
    })
  } catch (error) {
    res.status(500).send("An error occurred")
  }
  
})

router.post("/createNewCategory",verifyUser, async(req:RequestWithUser,res) => {
  const {categoryName} = req.body
  const userId = req.user
  if(!userId)return
  try {
    await User.findByIdAndUpdate({_id: userId}, {$push: {categories: categoryName}})
    res.send("success")
  } catch (error) {
    res.status(500).send(categoryName)
  }
})
interface RequestWithUser extends Request {
  user?: string
}
router.post("/deleteCategory",verifyUser, async(req:RequestWithUser,res) => {
  const { newBooksArray, categoryList } = req.body
  const userId = req.user
  if(!userId)return
  try {
    await User.findByIdAndUpdate({_id: userId}, {categories: categoryList, books: newBooksArray})
    res.send("success")
  } catch (error) {
    res.status(400).send("error")
  }
})

const multerFieldOptions = [{name: "imgFile", maxCount:1},{name: "pdfFile", maxCount:1}]


router.post("/addBook",upload.fields(multerFieldOptions),verifyUser, async(req:RequestWithUser, res) => {
  const files = req.files

  try {
    const uploadedImgFileDetails:string[] = []
    const uploadedpdfFileDetails:string[] = []
    if(files && "imgFile" in files){
      for( let file in files){
        await uploadFile(files[file][0])
        ?.then(async(data)=>{
          await deleteFilesAfterUpload(files[file][0].path)
          if(files[file][0].mimetype.startsWith("image")){
            uploadedImgFileDetails.push(data.Location, data.Key)
          }else{
            uploadedpdfFileDetails.push(data.Location, data.Key)
          }
        })
      }
    }

    const book:ProcessedBookInterface = {
      name: req.body.name,
      author:req.body.author,
      numberOfPages: req.body.numberOfPages,
      ISBN: req.body.ISBN,
      id: crypto.randomBytes(16).toString("hex"),
      link: req.body.link,
      imgFile: uploadedImgFileDetails,
      pdfFile: uploadedpdfFileDetails,
      isFavourite: req.body.isFavourite === "true" ? true : false,
      rating: req.body.rating,
      categories: req.body.categories,
      dateAdded: String(Date.now()),
      description: req.body.description,
    }
    await User.findByIdAndUpdate({_id: req.user},{$push: {books: book}})
    console.log(book)
    res.json({book})
  } catch (error) {
    console.log(error)
    res.status(500).send("an error occurred")
  }
  
})
router.post("/deleteBook",verifyUser, async(req:RequestWithUser,res) => {
  const userId = req.user
  const {bookId} = req.body
  try {
    await User.findByIdAndUpdate({_id: userId},{$pull: {books: {id: bookId}}})
    const user = await User.findById({_id: userId})
    const book = user?.books.find(book => book.id === bookId)
    if(!book)return
    const  {imgFile, pdfFile} = book
    deleteOldFiles(imgFile[1])
    deleteOldFiles(pdfFile[1])
    res.send("success")
  } catch (error) {
    console.log(error)
  }
  
})

router.post("/changeName", verifyUser, async(req:RequestWithUser,res)=>{
  const userId = req.user
  const { newName } = req.body
  try {
    await User.findByIdAndUpdate({_id:userId}, {username: newName})
    res.send(newName)
  } catch (error) {
    res.status(400).send("An error occurred")
  }
})

