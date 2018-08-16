export type FileStub = {
  lastModified: number
  name: string
  size: number
  type?: string
}

export type FileTransfer = {
  bytesTransferred: number
  buffer: ArrayBuffer[]
}

