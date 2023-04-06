"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.router = void 0;
const express_1 = __importDefault(require("express"));
require("dotenv").config();
const Password_Config_1 = require("./Config/Password_Config");
const crypto = __importStar(require("crypto"));
const mongooseSchema_1 = require("./mongooseSchema");
const Verify_1 = require("./utils/Verify");
const authenticateUser_1 = require("./Middlewares/authenticateUser");
const multer_1 = __importDefault(require("multer"));
const aws_s3_1 = require("./utils/aws_s3");
const google_1 = require("./utils/google");
const upload = (0, multer_1.default)({ dest: "uploads/" });
exports.router = express_1.default.Router();
exports.router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = (0, Password_Config_1.generateHash)(password, salt);
    try {
        const usedEmail = yield mongooseSchema_1.User.findOne({ email });
        if (usedEmail) {
            return res.status(400).send("Email has already been used, login");
        }
        yield mongooseSchema_1.User.create({
            username,
            email,
            salt,
            hash,
            books: [],
            categories: ["Comedy", "Entertainment", "Wealth"]
        });
        const user = yield mongooseSchema_1.User.findOne({ email });
        console.log(user);
        if (!user)
            return;
        const { id } = user;
        const accessToken = (0, Verify_1.generateAccessToken)(id);
        const refreshToken = (0, Verify_1.generateRefreshToken)(id);
        res.json({
            accessToken,
            refreshToken,
            username
        });
    }
    catch (error) {
        res.status(500).send("something went wrong");
    }
}));
exports.router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield mongooseSchema_1.User.findOne({ email });
        if (!user) {
            res.status(400).send("Couldn't find user");
            console.log("Couldn't find user");
            return;
        }
        const { salt, hash, id, username, books, categories } = user;
        if (!salt || !hash)
            return res.status(500).send("an error occurred, try again");
        const isPasswordValid = (0, Password_Config_1.verifyPassword)(password, hash, salt);
        if (!isPasswordValid) {
            res.json(400).send("Incorrect password");
            return;
        }
        const accessToken = (0, Verify_1.generateAccessToken)(id);
        const refreshToken = (0, Verify_1.generateRefreshToken)(id);
        res.json({
            accessToken,
            refreshToken,
            username,
            books,
            categories
        });
    }
    catch (error) {
        res.status(500).send("An error occurred");
    }
}));
exports.router.post("/registerGoogle", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, username, password } = req.body;
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = (0, Password_Config_1.generateHash)(password, salt);
    (0, google_1.getUserInfoWithGoogle)(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI_REGISTER, code)
        .then((userData) => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = yield mongooseSchema_1.User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({ msg: "email has been used please login" });
        }
        yield mongooseSchema_1.User.create({
            username,
            email: userData.email,
            salt,
            hash,
            books: [],
            categories: ["Comedy", "Entertainment", "Wealth"]
        });
        const user = yield mongooseSchema_1.User.findOne({ email: userData.email });
        const id = user === null || user === void 0 ? void 0 : user.id;
        const accessToken = (0, Verify_1.generateAccessToken)(id);
        const refreshToken = (0, Verify_1.generateRefreshToken)(id);
        res.json({
            username: userData.given_name,
            email: userData.email,
            accessToken,
            refreshToken,
        });
    }))
        .catch(err => console.log(err));
}));
exports.router.post("/loginGoogle", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    try {
        const userData = yield (0, google_1.getUserInfoWithGoogle)(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI_LOGIN, code);
        const existingUser = yield mongooseSchema_1.User.findOne({ email: userData.email });
        if (!existingUser) {
            return res.status(400).json({ msg: "user not found" });
        }
        const { id, books, categories } = existingUser;
        const accessToken = (0, Verify_1.generateAccessToken)(id);
        const refreshToken = (0, Verify_1.generateRefreshToken)(id);
        res.json({
            username: userData.given_name,
            email: userData.email,
            accessToken,
            refreshToken,
            books,
            categories
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ msg: "couldn't login with google" });
    }
}));
exports.router.get("/user", authenticateUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user;
    const user = yield mongooseSchema_1.User.findOne({ _id: userId });
    if (!user)
        return;
    res.json({
        username: user.username,
        books: user.books,
        categories: user.categories
    });
}));
exports.router.post("/newAccessToken", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken, email } = req.body;
    try {
        const user = yield mongooseSchema_1.User.findOne({ email });
        if (!user)
            return;
        const tokens = (0, Verify_1.generateNewTokens)(refreshToken, user.id, res);
        res.json({
            accessToken: tokens === null || tokens === void 0 ? void 0 : tokens.newAccessToken,
            refreshToken: tokens === null || tokens === void 0 ? void 0 : tokens.newRefreshToken
        });
    }
    catch (error) {
        res.status(500).send("An error occurred");
    }
}));
exports.router.post("/createNewCategory", authenticateUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryName } = req.body;
    const userId = req.user;
    if (!userId)
        return;
    try {
        yield mongooseSchema_1.User.findByIdAndUpdate({ _id: userId }, { $push: { categories: categoryName } });
        res.send("success");
    }
    catch (error) {
        res.status(500).send(categoryName);
    }
}));
exports.router.post("/deleteCategory", authenticateUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { newBooksArray, categoryList } = req.body;
    const userId = req.user;
    if (!userId)
        return;
    try {
        yield mongooseSchema_1.User.findByIdAndUpdate({ _id: userId }, { categories: categoryList, books: newBooksArray });
        res.send("success");
    }
    catch (error) {
        res.status(400).send("error");
    }
}));
const multerFieldOptions = [{ name: "imgFile", maxCount: 1 }, { name: "pdfFile", maxCount: 1 }];
exports.router.post("/addBook", upload.fields(multerFieldOptions), authenticateUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const files = req.files;
    try {
        const uploadedImgFileDetails = [];
        const uploadedpdfFileDetails = [];
        if (files && "imgFile" in files) {
            for (let file in files) {
                yield ((_a = (0, aws_s3_1.uploadFile)(files[file][0])) === null || _a === void 0 ? void 0 : _a.then((data) => __awaiter(void 0, void 0, void 0, function* () {
                    yield (0, aws_s3_1.deleteFilesAfterUpload)(files[file][0].path);
                    if (files[file][0].mimetype.startsWith("image")) {
                        uploadedImgFileDetails.push(data.Location, data.Key);
                    }
                    else {
                        uploadedpdfFileDetails.push(data.Location, data.Key);
                    }
                })));
            }
        }
        const book = {
            name: req.body.name,
            author: req.body.author,
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
        };
        yield mongooseSchema_1.User.findByIdAndUpdate({ _id: req.user }, { $push: { books: book } });
        console.log(book);
        res.json({ book });
    }
    catch (error) {
        console.log(error);
        res.status(500).send("an error occurred");
    }
}));
exports.router.post("/deleteBook", authenticateUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user;
    const { bookId } = req.body;
    try {
        yield mongooseSchema_1.User.findByIdAndUpdate({ _id: userId }, { $pull: { books: { id: bookId } } });
        const user = yield mongooseSchema_1.User.findById({ _id: userId });
        const book = user === null || user === void 0 ? void 0 : user.books.find(book => book.id === bookId);
        if (!book)
            return;
        const { imgFile, pdfFile } = book;
        (0, aws_s3_1.deleteOldFiles)(imgFile[1]);
        (0, aws_s3_1.deleteOldFiles)(pdfFile[1]);
        res.send("success");
    }
    catch (error) {
        console.log(error);
    }
}));
exports.router.post("/changeName", authenticateUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user;
    const { newName } = req.body;
    try {
        yield mongooseSchema_1.User.findByIdAndUpdate({ _id: userId }, { username: newName });
        res.send(newName);
    }
    catch (error) {
        res.status(400).send("An error occurred");
    }
}));
