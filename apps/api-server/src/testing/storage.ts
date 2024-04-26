import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createFileSystemStorageClient } from '~/modules/storage-fs'

export async function setUpTestStorage() {
  const dirPath = await mkdtemp(path.join(tmpdir(), 'repro-test-'))

  return {
    storage: createFileSystemStorageClient({
      path: dirPath,
    }),
    close: async () => {
      await rm(dirPath, { force: true, recursive: true })
    },
  }
}
