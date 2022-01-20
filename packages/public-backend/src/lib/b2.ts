import { nanoid } from 'nanoid/async'

interface AccessDetails {
  absoluteMinimumPartSize: number
  accountId: string
  allowed: {
    bucketId: string | null
    bucketName: string | null
    capabilities: Array<string>
    namePrefix: string | null
  }
  apiUrl: string
  authorizationToken: string
  downloadUrl: string
  recommendedPartSize: number
  s3ApiUrl: string
}

interface UploadURLDetails {
  authorizationToken: string
  bucketId: string
  uploadUrl: string
}

enum CacheKeys {
  ACCESS_DETAILS = 'access_details',
  UPLOAD_URL_DETAILS = 'upload_url_details',
}

export async function getFile(fileName: string): Promise<Response | null> {
  const accessDetails = await getAccessDetails()

  if (!accessDetails) {
    return null
  }

  const getFileRes = await fetch(
    `${accessDetails.downloadUrl}/file/${STORAGE_API_BUCKET_NAME}/${fileName}`,
    {
      method: 'GET',

      headers: {
        Authorization: accessDetails.authorizationToken,
      },
    }
  )

  if (!getFileRes.ok) {
    return null
  }

  return getFileRes
}

export async function uploadFile(file: File): Promise<string | null> {
  const uploadUrlDetails = await getUploadUrlDetails()

  if (!uploadUrlDetails) {
    return null
  }

  // TODO: collision detection
  const fileName = `${await nanoid()}.repro`

  const res = await fetch(uploadUrlDetails.uploadUrl, {
    method: 'POST',

    headers: {
      Authorization: uploadUrlDetails.authorizationToken,
      'Content-Type': 'application/octet-stream',
      'Content-Length': file.size.toString(),
      'X-Bz-File-Name': fileName,
      'X-Bz-Content-sha1': await checksum(file),
    },

    body: file.stream(),
  })

  if (!res.ok) {
    return null
  }

  return fileName
}

async function getUploadUrlDetails(): Promise<UploadURLDetails | null> {
  const cachedDetails = await SESSION.get<UploadURLDetails>(
    CacheKeys.UPLOAD_URL_DETAILS,
    'json'
  )

  if (cachedDetails) {
    return cachedDetails
  }

  const accessDetails = await getAccessDetails()

  if (!accessDetails) {
    return null
  }

  const getUploadUrlRes = await fetch(
    `${accessDetails.apiUrl}/b2api/${STORAGE_API_VERSION}/b2_get_upload_url`,
    {
      method: 'POST',

      headers: {
        Authorization: accessDetails.authorizationToken,
      },

      body: JSON.stringify({
        bucketId: STORAGE_API_BUCKET_ID,
      }),
    }
  )

  const getUploadUrlBody = await getUploadUrlRes.json<UploadURLDetails>()

  if (!getUploadUrlRes.ok) {
    console.error(getUploadUrlBody)
    return null
  }

  await SESSION.put(
    CacheKeys.UPLOAD_URL_DETAILS,
    JSON.stringify(getUploadUrlBody),
    {
      expirationTtl: 60 * 60 * 20,
    }
  )

  return getUploadUrlBody
}

async function getAccessDetails(): Promise<AccessDetails | null> {
  const cachedDetails = await SESSION.get<AccessDetails>(
    CacheKeys.ACCESS_DETAILS,
    'json'
  )

  if (cachedDetails) {
    return cachedDetails
  }

  const authUrl = `${STORAGE_API_DEFAULT_BASE_URL}/b2api/${STORAGE_API_VERSION}/b2_authorize_account`
  const authReqToken = btoa(`${STORAGE_API_KEY_ID}:${STORAGE_API_KEY}`)

  const authRes = await fetch(authUrl, {
    headers: {
      Authorization: `Basic ${authReqToken}`,
    },
  })

  const authBody = await authRes.json<AccessDetails>()

  if (!authRes.ok) {
    console.error(authBody)
    return null
  }

  await SESSION.put(CacheKeys.ACCESS_DETAILS, JSON.stringify(authBody), {
    expirationTtl: 60 * 60 * 20,
  })

  return authBody
}

async function checksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-1', buffer)
  const bytes = Array.from(new Uint8Array(digest))
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}
