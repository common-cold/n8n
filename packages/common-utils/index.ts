import CryptoJS from "crypto-js";

export function encryptData(data: string, encryptionkey: string) {
    const ciphertext = CryptoJS.AES.encrypt(data, encryptionkey!).toString();
    return ciphertext;
}

export function decryptData(ciphertext: string, encryptionkey: string) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionkey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedText;
}