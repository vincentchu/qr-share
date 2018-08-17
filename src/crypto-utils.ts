import * as base64 from 'base64-js'

export type KeyIV = {
  key: CryptoKey
  iv: Uint8Array
}

type Data = string | ArrayBuffer
type DataBijection = (data: Data, keyIV: KeyIV) => PromiseLike<Data>

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

export const encrypt: DataBijection = (data: Data, keyIV: KeyIV): PromiseLike<Data> => {
  if (typeof data === 'string') {
    return encryptString(data, keyIV)
  }

  return encryptArrayBuffer(data, keyIV)
}

export const decrypt: DataBijection = (encryptedData: Data, keyIV: KeyIV): PromiseLike<Data> => {
  if (typeof encryptedData === 'string') {
    return decryptString(encryptedData, keyIV)
  }

  return decryptArrayBuffer(encryptedData, keyIV)
}

export const encryptArrayBuffer = (data: ArrayBuffer, keyIV: KeyIV): PromiseLike<ArrayBuffer> => {
  const { key, iv } = keyIV
  const bytes = new Uint8Array(data)

  return crypto.subtle.encrypt({ name: AESAlgo, iv }, key, bytes)
}

export const encryptString = (data: string, keyIV: KeyIV): PromiseLike<string> => {
  const encoder = new TextEncoder()
  const buffer = <ArrayBuffer>encoder.encode(data).buffer

  return encryptArrayBuffer(buffer, keyIV).then((encryptedBuf) => {
    const encryptedBytes = new Uint8Array(encryptedBuf)

    return base64.fromByteArray(encryptedBytes)
  })
}

export const decryptArrayBuffer = (data: ArrayBuffer, keyIV: KeyIV): PromiseLike<ArrayBuffer> => {
  const { key, iv } = keyIV

  return crypto.subtle.decrypt({ name: AESAlgo, iv }, key, data)
}

export const decryptString = (encrypted: string, keyIV: KeyIV): PromiseLike<string> => {
  const encryptedBuf = <ArrayBuffer>base64.toByteArray(encrypted).buffer

  return decryptArrayBuffer(encryptedBuf, keyIV).then((buf) => {
    const arr = new Uint8Array(buf)
    const dec = new TextDecoder('utf-8')

    return dec.decode(arr)
  })
}



