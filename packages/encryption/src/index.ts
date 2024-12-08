const IV_BYTE_LENGTH = 12
const KEY_BIT_LENGTH = 128

function generateIV() {
  const arr = new Uint8Array(IV_BYTE_LENGTH)
  return crypto.getRandomValues(arr)
}

function generateKey() {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: KEY_BIT_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

async function exportKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', key)
  return jwk.k as string
}

function importKey(key: string) {
  return crypto.subtle.importKey(
    'jwk',
    {
      alg: 'A128GCM',
      ext: true,
      k: key,
      key_ops: ['encrypt', 'decrypt'],
      kty: 'oct',
    },
    {
      name: 'AES-GCM',
      length: KEY_BIT_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

function toBase64(data: Uint8Array): string {
  let binaryStr = ''
  const len = data.byteLength

  for (let i = 0; i < len; i++) {
    binaryStr += String.fromCharCode(data[i] as number)
  }

  return btoa(binaryStr)
}

function fromBase64(str: string): Uint8Array {
  const binaryStr = atob(str)
  const len = binaryStr.length
  const data = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    data.set([binaryStr.charCodeAt(i)], i)
  }

  return data
}

export async function encrypt(
  data: ArrayBuffer
): Promise<[ArrayBuffer, string]> {
  const key = await generateKey()
  const iv = generateIV()

  const output = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  )

  const exportedKey = await exportKey(key)
  const exportedIV = toBase64(iv)
  const keyParts = `${exportedIV}:${exportedKey}`

  return [output, keyParts]
}

export async function decrypt(
  data: ArrayBuffer,
  keyParts: string
): Promise<ArrayBuffer> {
  const [exportedIV, exportedKey] = keyParts.split(':')

  if (!exportedIV || !exportedKey) {
    throw new Error(`Crypto#decrypt: cannot find IV or encryption key`)
  }

  const key = await importKey(exportedKey)
  const iv = fromBase64(exportedIV)

  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  )
}
