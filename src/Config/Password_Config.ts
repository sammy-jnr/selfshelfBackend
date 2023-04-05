import * as crypto from "crypto"

export function verifyPassword(password:string, hash:string, salt:string) {
  if(!hash || !salt) return false
  var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

export function generateHash(password:string,salt:string) {
  var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return genHash
}

