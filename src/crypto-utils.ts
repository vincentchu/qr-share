import * as base64 from 'base64-js'
import { createReadStream } from 'fs';

type Data = string | ArrayBuffer
type DataBijection = (data: Data) => Promise<Data>

const AESAlgo = 'AES-CBC'
const AESParams = {
  name: AESAlgo,
  length: 256,
}

const KeyUses = [ 'encrypt', 'decrypt' ]

export const generateKey = () => crypto.subtle.generateKey(AESParams, true, KeyUses)

export const exportKey = (key: CryptoKey) => crypto.subtle.exportKey('raw', key)
  .then((buffer) => {
    const bytes = new Uint8Array(buffer, 0, buffer.byteLength)

    return base64.fromByteArray(bytes)
  })

export const importKey = (keyBase64: string) => {
  const bytes = <ArrayBuffer>base64.toByteArray(keyBase64).buffer

  return crypto.subtle.importKey('raw', bytes, AESAlgo, true, KeyUses)
}

export const encrypt: DataBijection = (data: Data): Promise<Data> => {


  return Promise.resolve(data)
}

export const encryptString = (data: string, key: CryptoKey, iv: Uint8Array): PromiseLike<string> => {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)
  console.log('STR BYTES', bytes)

  return crypto.subtle.encrypt({ name: AESAlgo, iv }, key, bytes)
    .then((encryptedBuffer) => {
      const encryptedBytes = new Uint8Array(encryptedBuffer)

      return base64.fromByteArray(encryptedBytes)
    })
}

export const decryptstring = (encrypted: string, key: CryptoKey, iv: Uint8Array): PromiseLike<string> => {
  const encryptedBytes = <ArrayBuffer>base64.toByteArray(encrypted).buffer

  return crypto.subtle.decrypt({ name: AESAlgo, iv }, key, encryptedBytes).then((plaintextBytes) => {

    // return String.fromCharCode.apply(null, new Uint16Array(plaintextBytes));


    const arr = new Uint8Array(plaintextBytes, 0, plaintextBytes.byteLength)
    // @ts-ignore
    window.arr = arr

    console.log('DECRYPT BYTES', arr)

    const dec = new TextDecoder('utf-8')
    return dec.decode(arr)

    // return base64.fromByteArray(new Uint8Array(plaintextBytes, 0, plaintextBytes.byteLength))
  })
}



