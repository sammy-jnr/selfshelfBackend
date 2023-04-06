"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNewTokens = exports.generateRefreshToken = exports.generateAccessToken = void 0;
require("dotenv").config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const generateAccessToken = (id) => {
    if (process.env.ACCESS_TOKEN_SECRET_KEY)
        return jsonwebtoken_1.default.sign({
            id: id
        }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: "1d" });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (id) => {
    if (process.env.REFRESH_TOKEN_SECRET_KEY)
        return jsonwebtoken_1.default.sign({
            id: id,
        }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: "7d" });
};
exports.generateRefreshToken = generateRefreshToken;
const generateNewTokens = (refreshToken, id, res) => {
    let newAccessToken;
    let newRefreshToken;
    if (!process.env.REFRESH_TOKEN_SECRET_KEY)
        return;
    jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(400).json({ msg: "invalid refresh token" });
        }
        newAccessToken = (0, exports.generateAccessToken)(id);
        newRefreshToken = (0, exports.generateRefreshToken)(id);
    });
    return { newAccessToken, newRefreshToken };
};
exports.generateNewTokens = generateNewTokens;
