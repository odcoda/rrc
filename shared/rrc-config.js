const defaultScopes = ['openid', 'offline_access', 'chat.completions:write']

const baseConfig = {
  clientId: '',
  redirectUri: '',
  scopes: defaultScopes,
  appUrl: '',
  appTitle: 'Robot Roll Call',
}

export const getOpenRouterConfig = () => {
  const runtime = window.RRC_OPENROUTER_CONFIG || {}
  const redirectUri = runtime.redirectUri || baseConfig.redirectUri || window.location.origin + window.location.pathname
  const appUrl = runtime.appUrl || baseConfig.appUrl || window.location.origin
  const appTitle = runtime.appTitle || baseConfig.appTitle
  const scopes = runtime.scopes && runtime.scopes.length ? runtime.scopes : baseConfig.scopes

  return {
    clientId: runtime.clientId || baseConfig.clientId || null,
    redirectUri,
    scopes,
    appUrl,
    appTitle,
  }
}
