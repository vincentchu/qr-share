export const promisify = <T>(callback: () => T): Promise<T> => new Promise((resolve, reject) => {
  try {
    resolve(callback())
  } catch (err) {
    reject(err)
  }
})

export const waitFor = (condition: () => boolean): Promise<void> => new Promise((resolve) => {
  const waiter = () => {
    if (condition()) {
      return resolve()
    }

    setTimeout(waiter, 500)
  }

  waiter()
})

export const resolveAfter = (millis: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, millis))

export const promisifyWithTimeout = <T>(promise: Promise<T>, millis: number): Promise<T> => {
  const timeoutPromise = resolveAfter(millis).then(() => {
    throw new Error(`promisifyWithTimeout: Timed out after ${millis} ms`)
  })


  return Promise.race([promise, timeoutPromise])
}

export const promiseLikeToPromise = <T>(promiseLike: PromiseLike<T>): Promise<T> => {
  return new Promise((resolve) => {
    promiseLike.then(resolve)
  })
}