import { AES, enc } from 'crypto-js';

export const DIM_SECURE = 'dim://';

export const DIM_VERIFICATION = 'dim://auth:';

const streamDeckEncrypt = (text: string, sharedKey: string) => {
  const encrypted = AES.encrypt(text, sharedKey).toString();
  return DIM_SECURE + encrypted;
};

const streamDeckDecrypt = (text: string, sharedKey: string) => {
  const sliced = text.slice(DIM_SECURE.length);
  const decrypted = AES.decrypt(sliced, sharedKey);
  return decrypted.toString(enc.Utf8);
};

export default {
  encrypt: streamDeckEncrypt,
  decrypt: streamDeckDecrypt,
};
