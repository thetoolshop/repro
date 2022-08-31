import { AsyncGunzipOptions, unzlib } from 'fflate'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { decrypt } from '~/libs/crypto'
import {
  createHttpSource,
  createNullSource,
  PlaybackFromSourceProvider,
} from '~/libs/playback'
import { NavigationContext } from './context'

function unzlibP(data: Uint8Array, opts: AsyncGunzipOptions) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    unzlib(data, opts, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data.buffer)
      }
    })
  })
}

interface Props {
  baseUrl: string
}

export const SourceContainer: React.FC<Props> = ({ baseUrl }) => {
  const routerNavigate = useNavigate()
  const params = useParams()
  const keyParts = useRef(location.hash.replace(/^#/, ''))
  const [source, setSource] = useState(createNullSource())

  useEffect(() => {
    async function responseTransformer(
      data: ArrayBuffer
    ): Promise<ArrayBuffer> {
      return await unzlibP(
        new Uint8Array(await decrypt(data, keyParts.current)),
        {
          consume: true,
        }
      )
    }

    if (params.sourceId) {
      setSource(
        createHttpSource(
          `${baseUrl}/${params.sourceId}/recording`,
          responseTransformer
        )
      )
    }
  }, [params.sourceId, baseUrl, keyParts, setSource])

  const navigate = useCallback(
    (pathname: string) => {
      routerNavigate({
        pathname: `/${params.sourceId}/${pathname.replace(/^\//, '')}`,
        hash: keyParts.current,
      })
    },
    [routerNavigate, keyParts, params.sourceId]
  )

  return (
    <NavigationContext.Provider value={navigate}>
      <PlaybackFromSourceProvider source={source}>
        <Outlet />
      </PlaybackFromSourceProvider>
    </NavigationContext.Provider>
  )
}
