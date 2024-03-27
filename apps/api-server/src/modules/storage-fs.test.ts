import { chain, done } from 'fluture'
import { Readable } from 'stream'
import { setUpTestStorage } from '~/testing/storage'
import { stringToReadable } from '~/testing/utils'
import { Storage } from './storage'

describe('Modules > FileSystemStorage', () => {
  let reset: () => Promise<void>
  let storage: Storage

  beforeEach(async () => {
    const { storage: storageInstance, close: closeStorage } =
      await setUpTestStorage()
    storage = storageInstance
    reset = closeStorage
  })

  afterEach(async () => {
    await reset()
  })

  it('should write a file in a nested directory', next => {
    done<Error, void>(err => {
      expect(err).toBeNull()
      next()
    })(
      stringToReadable('bar-data').pipe(
        chain(readable => storage.write('foo/bar', readable))
      )
    )
  })

  it('should not allow directory traversal when checking file existence', next => {
    done<Error, boolean>((err, value) => {
      expect(err).toBeNull()
      expect(value).toEqual(false)
      next()
    })(storage.exists('..'))
  })

  it('should not allow directory traversal when reading files', next => {
    done<Error, Readable>(err => {
      expect(err).not.toBeNull()
      expect(err?.name).toEqual('NotFoundError')
      next()
    })(storage.read('..'))
  })

  it('should not allow directory traversal when writing files', next => {
    done<Error, void>(err => {
      expect(err).not.toBeNull()
      expect(err?.name).toEqual('NotFoundError')
      next()
    })(storage.write('..', new Readable().destroy()))
  })
})
