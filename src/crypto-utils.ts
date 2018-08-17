import * as base64 from 'base64-js'

export type KeyIV = {
  key: CryptoKey
  iv: Uint8Array
}

type Data = string | ArrayBuffer
type DataBijection = (data: Data) => Promise<Data>


const AESAlgo = 'AES-CBC'
const AESParams = {
  name: AESAlgo,
  length: 256,
}

const KeyUses = [ 'encrypt', 'decrypt' ]

const IVLength = 16

export const generateKey = (): PromiseLike<KeyIV> =>
  crypto.subtle.generateKey(AESParams, true, KeyUses).then((key) => {
    const iv = new Uint8Array(IVLength)
    crypto.getRandomValues(iv)

    return { key, iv }
  })


export const exportKey = (keyIV: KeyIV): PromiseLike<string> => {
  const { key, iv } = keyIV

  return crypto.subtle.exportKey('raw', key)
    .then((keyBuf) => {
      const keyBytes = new Uint8Array(keyBuf)
      const bytes = new Uint8Array(keyBytes.length + IVLength)

      bytes.set(iv)
      bytes.set(keyBytes, IVLength)

      return base64.fromByteArray(bytes)
    })
}

export const importKey = (keyBase64: string): PromiseLike<KeyIV> => {
  const bytes = <ArrayBuffer>base64.toByteArray(keyBase64).buffer

  const iv = new Uint8Array(bytes.slice(0, IVLength))
  const keyBytes = bytes.slice(IVLength)

  return crypto.subtle.importKey('raw', keyBytes, AESAlgo, true, KeyUses).then((key) => ({
    key, iv
  }))
}

export const encrypt: DataBijection = (data: Data): Promise<Data> => {


  return Promise.resolve(data)
}
// export const encryptArrayBuffer = (data: ArrayBuffer, keyIV: KeyIV): PromiseLike<string> => {
//   const { key, iv } = keyIV
//   const bytes = new Uint8Array(data)

//   return crypto.subtle.encrypt({ name: AESAlgo, iv }, key, bytes)
//     .then((encryptedBuffer) => {
//       const encryptedBytes = new Uint8Array(encryptedBuffer)

//       return base64.fromByteArray(encryptedBytes)
//     })
// }

export const encryptString = (data: string, keyIV: KeyIV): PromiseLike<string> => {
  const { key, iv } = keyIV
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)

  return crypto.subtle.encrypt({ name: AESAlgo, iv }, key, bytes)
    .then((encryptedBuffer) => {
      const encryptedBytes = new Uint8Array(encryptedBuffer)

      return base64.fromByteArray(encryptedBytes)
    })
}

export const decryptstring = (encrypted: string, keyIV: KeyIV): PromiseLike<string> => {
  const { key, iv } = keyIV
  const encryptedBytes = <ArrayBuffer>base64.toByteArray(encrypted).buffer

  return crypto.subtle.decrypt({ name: AESAlgo, iv }, key, encryptedBytes).then((plaintextBytes) => {
    const arr = new Uint8Array(plaintextBytes, 0, plaintextBytes.byteLength)
    const dec = new TextDecoder('utf-8')

    return dec.decode(arr)
  })
}



