import CryptoJS from 'crypto-js';

const SECRET_KEY = 'OfflineChat-P2P-Secret-2026';

export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    if (!result) return null;
    return result;
  } catch {
    return null;
  }
}
