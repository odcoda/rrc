import { initAuth, startAuthorization, clearTokens, getAuthState, onAuthChange } from './rrc-auth.js'

const STATUS_LABELS = {
  authorized: 'Connected',
  authorizing: 'Connecting',
  error: 'Auth error',
  'signed-out': 'Disconnected',
}

const STATUS_COLORS = {
  authorized: '#1f7a6a',
  authorizing: '#d6a038',
  error: '#b94221',
  'signed-out': '#b9aea4',
}

const buildAuthMarkup = () => {
  const wrapper = document.createElement('div')
  wrapper.className = 'rrc-auth'
  wrapper.innerHTML = `
    <div class="rrc-auth__brand">
      <div class="rrc-auth__title">Robot Roll Call</div>
      <div class="rrc-auth__subtitle">Sign in once, then summon every robot.</div>
    </div>
    <div>
      <div class="rrc-auth__status">
        <span class="rrc-auth__dot" data-rrc-status-dot></span>
        <span data-rrc-status-text></span>
      </div>
      <div class="rrc-banner" data-rrc-status-error></div>
    </div>
    <div class="rrc-auth__actions">
      <button class="rrc-button" data-rrc-action="connect">Connect OpenRouter</button>
      <button class="rrc-button ghost" data-rrc-action="disconnect">Sign out</button>
    </div>
  `

  return wrapper
}

const updateAuthUI = (state, elements) => {
  const status = state.status || 'signed-out'
  const label = STATUS_LABELS[status] || STATUS_LABELS['signed-out']

  elements.statusText.textContent = label
  elements.statusDot.style.backgroundColor = STATUS_COLORS[status] || STATUS_COLORS['signed-out']
  elements.statusDot.style.boxShadow = `0 0 0 6px ${STATUS_COLORS[status] || STATUS_COLORS['signed-out']}33`

  const isAuthorized = status === 'authorized'
  elements.connectButton.disabled = status === 'authorizing'
  elements.disconnectButton.style.display = isAuthorized ? 'inline-flex' : 'none'
  elements.connectButton.style.display = isAuthorized ? 'none' : 'inline-flex'

  if (status === 'error' && state.lastError) {
    elements.errorBanner.textContent = state.lastError
  } else {
    elements.errorBanner.textContent = ''
  }
}

export const initRobotShell = async () => {
  const host = document.querySelector('[data-rrc-auth]')
  if (!host) {
    return
  }

  host.classList.add('rrc-auth-host')
  host.innerHTML = ''

  const markup = buildAuthMarkup()
  host.appendChild(markup)

  const elements = {
    statusText: host.querySelector('[data-rrc-status-text]'),
    statusDot: host.querySelector('[data-rrc-status-dot]'),
    errorBanner: host.querySelector('[data-rrc-status-error]'),
    connectButton: host.querySelector('[data-rrc-action="connect"]'),
    disconnectButton: host.querySelector('[data-rrc-action="disconnect"]'),
  }

  elements.connectButton.addEventListener('click', async () => {
    try {
      await startAuthorization()
    } catch (error) {
      console.error('Failed to start OpenRouter auth', error)
    }
  })

  elements.disconnectButton.addEventListener('click', () => {
    clearTokens()
  })

  onAuthChange((state) => updateAuthUI(state, elements))

  updateAuthUI(getAuthState(), elements)
  await initAuth()
}
