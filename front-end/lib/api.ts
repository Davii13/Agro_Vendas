export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  })

  if (response.status === 401) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
          }

          return fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              Authorization: `Bearer ${data.accessToken}`,
            },
          })
        }
      } catch (error) {
        console.error('Erro ao renovar token:', error)
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  return response
}
