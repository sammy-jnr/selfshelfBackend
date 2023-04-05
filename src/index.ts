import express, { Application } from "express"
import { router } from "./Routes"
import * as cors from "cors"
import mongoose from "mongoose"
import 'dotenv/config'

mongoose.connect(process.env.MONGO_URI!)
.then(()=>console.log("connected to mongoose"))
.catch((err) => console.log(err))

const app:Application = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))
const options: cors.CorsOptions = {
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: "https://selfshelf.onrender.com",
  preflightContinue: false,
};

app.use(cors.default(options))
app.use(router)

app.listen(5000, ()=> console.log("server listening at port 5000"))