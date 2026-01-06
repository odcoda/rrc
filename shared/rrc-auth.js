import { getOpenRouterConfig } from './rrc-config.js'

const AUTHORIZE_URL = 'https://openrouter.ai/oauth/authorize'
const AUTH_URL = 'https://openrouter.ai/auth'
const TOKEN_URL = 'https://openrouter.ai/api/v1/auth/keys'

const TOKEN_STORAGE_KEY = 'rrc:openrouter:tokens'
const PKCE_STORAGE_KEY = 'rrc:openrouter:pkce'

const listeners = new Set()
let lastError = ''

const safeStorage = () => {
  try {
    return window.localStorage
  } catch (error) {
    console.error('Local storage unavailable', error)
    return null
  }
}

const storage = safeStorage()

const readTokens = () => {
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(TOKEN_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Failed to parse OpenRouter tokens', error)
    return null
  }
}

let currentStatus = readTokens() ? 'authorized' : 'signed-out'

const notify = () => {
  const snapshot = getAuthState()
  listeners.forEach((listener) => listener(snapshot))
}

const writeTokens = (tokens) => {
  if (!storage) {
    return
  }

  try {
    storage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
  } catch (error) {
    console.error('Failed to save OpenRouter tokens', error)
  }
}

const savePkceSession = (session) => {
  if (!storage) {
    return
  }

  try {
    storage.setItem(PKCE_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Failed to persist PKCE session', error)
  }
}

const consumePkceSession = (expectedState) => {
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(PKCE_STORAGE_KEY)
    if (!raw) {
      return null
    }
    storage.removeItem(PKCE_STORAGE_KEY)

    const session = JSON.parse(raw)
    if (expectedState && session.state !== expectedState) {
      console.warn('PKCE state mismatch')
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to read PKCE session', error)
    return null
  }
}

const clearPkceSession = () => {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(PKCE_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear PKCE session', error)
  }
}

const toBase64Url = (bytes) => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')
}

const randomBytes = (length) => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint8Array(length))
  }

  const array = new Uint8Array(length)
  for (let index = 0; index < length; index += 1) {
    array[index] = Math.floor(Math.random() * 256)
  }
  return array
}

const generateCodeVerifier = (length = 96) => toBase64Url(randomBytes(length))

const generateCodeChallenge = async (verifier) => {
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return toBase64Url(new Uint8Array(digest))
  }

  throw new Error('SubtleCrypto not available for PKCE')
}

const generateState = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2)
}

const mapTokenResponse = (response) => ({
  accessToken: response.key,
  refreshToken: null,
  tokenType: 'Bearer',
  scopes: [],
  expiresAt: Number.POSITIVE_INFINITY,
})

const ensureStorageListener = () => {
  if (!storage || window.__rrcAuthStorageListener) {
    return
  }

  window.__rrcAuthStorageListener = true
  window.addEventListener('storage', (event) => {
    if (event.key !== TOKEN_STORAGE_KEY) {
      return
    }

    currentStatus = readTokens() ? 'authorized' : 'signed-out'
    notify()
  })
}

export const getAuthState = () => ({
  status: currentStatus,
  tokens: readTokens(),
  lastError,
})

export const onAuthChange = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const clearTokens = () => {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(TOKEN_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear OpenRouter tokens', error)
  }

  currentStatus = 'signed-out'
  lastError = ''
  notify()
}

export const setTokens = (tokens) => {
  writeTokens(tokens)
  currentStatus = 'authorized'
  lastError = ''
  notify()
}

export const setAuthError = (message) => {
  lastError = message
  currentStatus = 'error'
  notify()
}

export const markUnauthorized = (message) => {
  clearTokens()
  if (message) {
    setAuthError(message)
  }
}

export const createAuthorizationUrl = async (options = {}) => {
  const config = getOpenRouterConfig()

  if (!config.redirectUri) {
    throw new Error('OpenRouter redirect URI is missing')
  }

  const state = options.state || generateState()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  savePkceSession({
    state,
    codeVerifier,
    createdAt: Date.now(),
  })

  const useClientFlow = Boolean(config.clientId)
  const url = new URL(useClientFlow ? AUTHORIZE_URL : AUTH_URL)
  url.searchParams.set('response_type', 'code')

  if (useClientFlow) {
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('redirect_uri', config.redirectUri)
    if ((options.scopes || config.scopes).length) {
      url.searchParams.set('scope', (options.scopes || config.scopes).join(' '))
    }
    url.searchParams.set('prompt', options.prompt || 'consent')
  } else {
    url.searchParams.set('callback_url', config.redirectUri)
  }

  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  return {
    url: url.toString(),
    state,
  }
}

export const exchangeAuthorizationCode = async ({ code, state }) => {
  const config = getOpenRouterConfig()
  if (!config.redirectUri) {
    throw new Error('OpenRouter redirect URI is missing')
  }

  const session = consumePkceSession(state)
  if (!session) {
    throw new Error('PKCE session missing or state mismatch; restart sign-in')
  }

  const payload = {
    code,
    code_verifier: session.codeVerifier,
    code_challenge_method: 'S256',
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to exchange authorization code: ${errorText}`)
  }

  const json = await response.json()
  return mapTokenResponse(json)
}

const scrubAuthParams = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')

  const cleaned = url.search ? `${url.pathname}?${url.searchParams.toString()}` : url.pathname
  window.history.replaceState({}, document.title, `${cleaned}${url.hash}`)
}

export const initAuth = async () => {
  ensureStorageListener()

  const params = new URLSearchParams(window.location.search)
  const error = params.get('error')
  const errorDescription = params.get('error_description')

  if (error) {
    setAuthError(errorDescription || error)
    clearPkceSession()
    scrubAuthParams()
    return
  }

  const code = params.get('code')
  const state = params.get('state') || ''

  if (!code) {
    notify()
    return
  }

  currentStatus = 'authorizing'
  lastError = ''
  notify()

  try {
    const tokens = await exchangeAuthorizationCode({ code, state })
    setTokens(tokens)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenRouter authorization failed'
    setAuthError(message)
  } finally {
    scrubAuthParams()
  }
}

export const startAuthorization = async () => {
  currentStatus = 'authorizing'
  lastError = ''
  notify()

  const { url } = await createAuthorizationUrl()
  window.location.assign(url)
}

export const getTokens = () => readTokens()
