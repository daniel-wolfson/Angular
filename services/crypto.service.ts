import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

export type TokenData = {
  exp: number,
  iat: number,
  nbf: number,
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/userdata": string,
  sagToken:string
}

@Injectable({
  providedIn: 'root'
})

export class CryptoService {
  private TOKEN_SECRET_KEY = "crpm2019castcrpm";

  constructor() { }
  // encrypt plainText to AES string 
  encrypt(plainText: string) {
    const _key = CryptoJS.enc.Utf8.parse(this.TOKEN_SECRET_KEY);
    const encrypted = CryptoJS.AES.encrypt(plainText, _key, {
        keySize: 16,
        iv: _key,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

// decrypt encrypted AES string to plain text
decrypt(encryptedText: any) {
    const _key = CryptoJS.enc.Utf8.parse(this.TOKEN_SECRET_KEY);
    const decrypted = CryptoJS.AES.decrypt(
        encryptedText, _key, {
        keySize: 16,
        iv: _key,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);

    return decrypted;
}
}