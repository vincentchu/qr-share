export type FileStub = {
  fileUUID: string
  lastModified: number
  name: string
  size: number
  type?: string
}

export type FileTransfer = {
  bytesTransferred: number
  buffer: ArrayBuffer[]
}

