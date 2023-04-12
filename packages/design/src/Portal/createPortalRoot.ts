import { PORTAL_ROOT_ID } from './constants'

const MAX_INT32 = 2 ** 32 - 1

export function createPortalRoot() {
  const root = document.createElement('div')
  root.id = PORTAL_ROOT_ID
  root.style.position = 'fixed'
  root.style.top = '0'
  root.style.left = '0'
  root.style.zIndex = `${MAX_INT32}`
  document.body.appendChild(root)
}
