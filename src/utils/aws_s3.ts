import S3 from "aws-sdk/clients/s3"
import fs from "fs"
import util from "util"
import 'dotenv/config'


const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey
})

export const deleteFilesAfterUpload = util.promisify(fs.unlink)

export const uploadFile = (file:Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path)
  if(!bucketName)return
  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename
  }

  return s3.upload(uploadParams).promise()
}

export const deleteOldFiles = async(path:string) => {
  if(!path || !bucketName)return
  try {
    s3.deleteObject({Bucket: bucketName, Key:path},(err) => {
      if(err) console.log(err)
    })
  } catch (error) {
    console.log(error)
  }
  
}

