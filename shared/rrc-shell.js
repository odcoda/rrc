import { initAuth, startAuthorization, clearTokens, getAuthState, onAuthChange } from './rrc-auth.js'

const STATUS_LABELS = {
  authorized: 'Connected',
  authorizing: 'Connecting',
  error: 'Auth error',
  'signed-out': 'Disconnected',
}

const DEFAULT_COPY = {
  title: 'Robot Roll Call',
  subtitle: 'Sign in once, then summon every robot.',
  connect: 'Connect OpenRouter',
  disconnect: 'Sign out',
}

const DEFAULT_THEME = {
  background: 'rgba(246, 239, 230, 0.85)',
  borderColor: 'rgba(31, 27, 23, 0.1)',
  textColor: '#1f1b17',
  mutedTextColor: '#3a302a',
  fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
  titleFontFamily: "'Fraunces', Georgia, serif",
  buttonBackground: '#e4572e',
  buttonTextColor: '#fff',
  buttonHoverBackground: '#b94221',
  buttonHoverTextColor: '#fff',
  buttonShadow: '0 12px 20px rgba(228, 87, 46, 0.24)',
  buttonHoverShadow: '0 16px 26px rgba(228, 87, 46, 0.28)',
  ghostTextColor: '#b94221',
  ghostBorderColor: 'rgba(228, 87, 46, 0.35)',
  ghostHoverBackground: 'rgba(228, 87, 46, 0.1)',
  errorColor: '#b94221',
  statusColors: {
    authorized: '#1f7a6a',
    authorizing: '#d6a038',
    error: '#b94221',
    'signed-out': '#b9aea4',
  },
}

const THEME_PROPERTIES = {
  background: '--rrc-auth-background',
  borderColor: '--rrc-auth-border-color',
  textColor: '--rrc-auth-text-color',
  mutedTextColor: '--rrc-auth-muted-text-color',
  fontFamily: '--rrc-auth-font-family',
  titleFontFamily: '--rrc-auth-title-font-family',
  buttonBackground: '--rrc-auth-button-background',
  buttonTextColor: '--rrc-auth-button-text-color',
  buttonHoverBackground: '--rrc-auth-button-hover-background',
  buttonHoverTextColor: '--rrc-auth-button-hover-text-color',
  buttonShadow: '--rrc-auth-button-shadow',
  buttonHoverShadow: '--rrc-auth-button-hover-shadow',
  ghostTextColor: '--rrc-auth-ghost-text-color',
  ghostBorderColor: '--rrc-auth-ghost-border-color',
  ghostHoverBackground: '--rrc-auth-ghost-hover-background',
  errorColor: '--rrc-auth-error-color',
}

const resolveOptions = (options) => ({
  copy: {
    ...DEFAULT_COPY,
    ...options.copy,
  },
  theme: {
    ...DEFAULT_THEME,
    ...options.theme,
    statusColors: {
      ...DEFAULT_THEME.statusColors,
      ...options.theme?.statusColors,
    },
  },
})

const applyTheme = (element, theme) => {
  for (const [themeKey, property] of Object.entries(THEME_PROPERTIES)) {
    element.style.setProperty(property, theme[themeKey])
  }
}

const buildAuthMarkup = ({ copy, theme }) => {
  const wrapper = document.createElement('div')
  wrapper.className = 'rrc-auth'
  wrapper.innerHTML = `
    <div class="rrc-auth__brand">
      <div class="rrc-auth__title" data-rrc-title></div>
      <div class="rrc-auth__subtitle" data-rrc-subtitle></div>
    </div>
    <div>
      <div class="rrc-auth__status">
        <span class="rrc-auth__dot" data-rrc-status-dot></span>
        <span data-rrc-status-text></span>
      </div>
      <div class="rrc-banner" data-rrc-status-error></div>
    </div>
    <div class="rrc-auth__actions">
      <button class="rrc-button" data-rrc-action="connect"></button>
      <button class="rrc-button ghost" data-rrc-action="disconnect"></button>
    </div>
  `

  wrapper.querySelector('[data-rrc-title]').textContent = copy.title
  wrapper.querySelector('[data-rrc-subtitle]').textContent = copy.subtitle
  wrapper.querySelector('[data-rrc-action="connect"]').textContent = copy.connect
  wrapper.querySelector('[data-rrc-action="disconnect"]').textContent = copy.disconnect
  applyTheme(wrapper, theme)

  return wrapper
}

const updateAuthUI = (state, elements, statusColors) => {
  const status = state.status || 'signed-out'
  const label = STATUS_LABELS[status] || STATUS_LABELS['signed-out']
  const color = statusColors[status] || statusColors['signed-out']

  elements.statusText.textContent = label
  elements.statusDot.style.backgroundColor = color
  elements.statusDot.style.boxShadow = `0 0 0 6px color-mix(in srgb, ${color} 20%, transparent)`

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

export const initRobotShell = async (options = {}) => {
  const host = document.querySelector('[data-rrc-auth]')
  if (!host) {
    return
  }

  const resolvedOptions = resolveOptions(options)

  host.classList.add('rrc-auth-host')
  host.innerHTML = ''

  const markup = buildAuthMarkup(resolvedOptions)
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

  onAuthChange((state) => updateAuthUI(state, elements, resolvedOptions.theme.statusColors))

  updateAuthUI(getAuthState(), elements, resolvedOptions.theme.statusColors)
  await initAuth()
}
