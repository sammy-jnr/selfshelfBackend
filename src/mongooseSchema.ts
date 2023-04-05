import mongoose from "mongoose";

const BookSchema = new mongoose.Schema({
  name: String,
  id: String,
  author: String,
  rating: Number,
  pdfFile: [String],
  dateAdded: String,
  categories: [String],
  imgFile: [String],
  link: String,
  numberOfPages: Number,
  ISBN: Number,
  description: String,
  isFavourite: Boolean
})

const  UserSchema = new mongoose.Schema({
  username:String,
  email:String,
  password:String,
  hash: String,
  salt: String,
  categories:[String],
  books:[BookSchema]
})

export const User = mongoose.model("user", UserSchema)


