"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldFiles = exports.uploadFile = exports.deleteFilesAfterUpload = void 0;
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
require("dotenv/config");
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new s3_1.default({
    region,
    accessKeyId,
    secretAccessKey
});
exports.deleteFilesAfterUpload = util_1.default.promisify(fs_1.default.unlink);
const uploadFile = (file) => {
    const fileStream = fs_1.default.createReadStream(file.path);
    if (!bucketName)
        return;
    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename
    };
    return s3.upload(uploadParams).promise();
};
exports.uploadFile = uploadFile;
const deleteOldFiles = (path) => __awaiter(void 0, void 0, void 0, function* () {
    if (!path || !bucketName)
        return;
    try {
        s3.deleteObject({ Bucket: bucketName, Key: path }, (err) => {
            if (err)
                console.log(err);
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.deleteOldFiles = deleteOldFiles;
