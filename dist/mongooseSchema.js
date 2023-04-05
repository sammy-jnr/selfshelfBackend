"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BookSchema = new mongoose_1.default.Schema({
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
});
const UserSchema = new mongoose_1.default.Schema({
    username: String,
    email: String,
    password: String,
    hash: String,
    salt: String,
    categories: [String],
    books: [BookSchema]
});
exports.User = mongoose_1.default.model("user", UserSchema);
