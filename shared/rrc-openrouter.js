import { getOpenRouterConfig } from './rrc-config.js'
import { getTokens, markUnauthorized } from './rrc-auth.js'

const API_BASE_URL = 'https://openrouter.ai/api/v1'

const buildHeaders = (tokens, config, init = {}) => {
  const headers = new Headers(init)

  headers.set('Authorization', `${tokens.tokenType || 'Bearer'} ${tokens.accessToken}`)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (config.appUrl) {
    headers.set('HTTP-Referer', config.appUrl)
  }

  if (config.appTitle) {
    headers.set('X-Title', config.appTitle)
  }

  return headers
}

const createCompletion = async (path, body) => {
  const tokens = getTokens()
  if (!tokens) {
    throw new Error('OpenRouter tokens are not available. Connect first.')
  }

  const config = getOpenRouterConfig()
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: buildHeaders(tokens, config),
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    markUnauthorized('OpenRouter request unauthorized')
    throw new Error('OpenRouter request unauthorized')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter request failed: ${errorText}`)
  }

  return response.json()
}

export const createChatCompletion = async (body) => createCompletion('chat/completions', body)

export const createTextCompletion = async (body) => createCompletion('completions', body)

export const listModels = async () => {
  const tokens = getTokens()
  if (!tokens) {
    throw new Error('OpenRouter tokens are not available. Connect first.')
  }

  const config = getOpenRouterConfig()
  const response = await fetch(`${API_BASE_URL}/models`, {
    headers: buildHeaders(tokens, config),
  })

  if (response.status === 401) {
    markUnauthorized('OpenRouter request unauthorized')
    throw new Error('OpenRouter request unauthorized')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter request failed: ${errorText}`)
  }

  return response.json()
}

export const extractCompletionText = (response) => {
  if (!response || !response.choices || !response.choices.length) {
    return ''
  }

  return (response.choices[0].message?.content || response.choices[0].text || '').trim()
}

export const extractChatMessage = extractCompletionText
