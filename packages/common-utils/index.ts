import CryptoJS from "crypto-js";
import sha256 from 'crypto-js/sha256';

export const CHANNEL_NAME = "NODE_UPDATE";

export const WEBHOOK_MAP = "WEBHOOK_MAP";

export function encryptData(data: string, encryptionkey: string) {
    const ciphertext = CryptoJS.AES.encrypt(data, encryptionkey!).toString();
    return ciphertext;
}

export function decryptData(ciphertext: string, encryptionkey: string) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionkey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedText;
}

export function hashString(data: string) {
    const val = sha256(data);
    return val.toString();
}

export function validatePass(password: string, hashedPassword: string) {
    return hashedPassword === hashString(password);
}
