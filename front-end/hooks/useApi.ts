'use client'

import { useAuth } from './useAuth'
import { useRouter } from 'next/navigation'

export function useApi() {
  const { refreshToken } = useAuth()
  const router = useRouter()

  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const accessToken = getAccessToken()

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
    })

    if (response.status === 401) {
      const tokenRefreshed = await refreshToken()

      if (tokenRefreshed) {
        const newAccessToken = getAccessToken()
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        })
      } else {
        router.push('/login')
        throw new Error('Sessão expirada')
      }
    }

    return response
  }

  return { apiFetch }
}
