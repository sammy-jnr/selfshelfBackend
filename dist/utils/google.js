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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInfoWithGoogle = void 0;
const axios = require("axios");
const getUserInfoWithGoogle = (client_id, client_secret, redirect_uri, code) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield getAccessToken(client_id, client_secret, redirect_uri, code);
    const userInfo = yield getUserInfo(data);
    return userInfo;
});
exports.getUserInfoWithGoogle = getUserInfoWithGoogle;
const getAccessToken = (client_id, client_secret, redirect_uri, code) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios({
            withCredentials: true,
            url: `https://oauth2.googleapis.com/token`,
            method: "post",
            data: {
                client_id,
                client_secret,
                redirect_uri,
                grant_type: "authorization_code",
                code
            }
        });
        return data;
    }
    catch (error) {
        console.log(error);
    }
});
const getUserInfo = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInfo = yield axios({
            withCredentials: true,
            url: `https://www.googleapis.com/oauth2/v2/userinfo`,
            method: "get",
            headers: {
                Authorization: `Bearer ${data.access_token}`,
            }
        });
        return userInfo.data;
    }
    catch (error) {
        console.log(error);
    }
});
