import { decrypt, encrypt } from '.'

describe('Encryption', () => {
  it('should encrypt and decrypt a value', async () => {
    const input = 'this is a test value'
    const buffer = new TextEncoder().encode(input)
    const [encryptedValue, key] = await encrypt(buffer)
    const decryptedValue = await decrypt(encryptedValue, key)
    const output = new TextDecoder().decode(decryptedValue)
    expect(output).toEqual(input)
  })
})
