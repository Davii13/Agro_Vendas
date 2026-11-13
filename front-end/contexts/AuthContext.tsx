'use client'

import React, { createContext, useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/lib/api'

export interface User {
  id: number
  email: string
  nome: string
  role?: 'ADMIN' | 'OPERADOR'
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, senha: string, manterConectado?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken')
    }
    return null
  }

  const setTokens = (accessToken: string, refreshToken: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(userData))
    }
    setUser(userData)
  }

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
    setUser(null)
  }

  const login = useCallback(async (email: string, senha: string, manterConectado = false) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha, manterConectado }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.erro || 'Erro ao fazer login')
      }

      const data = await response.json()
      setTokens(data.accessToken, data.refreshToken, data.usuario)
    } catch (error) {
      clearTokens()
      throw error
    }
  }, [])

  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken()
      if (!refreshTokenValue) {
        clearTokens()
        return false
      }

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      })

      if (!response.ok) {
        clearTokens()
        return false
      }

      const data = await response.json()
      setTokens(data.accessToken, data.refreshToken, data.usuario)
      return true
    } catch (error) {
      clearTokens()
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshTokenValue = getRefreshToken()
      if (refreshTokenValue) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        })
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      clearTokens()
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user')
          const accessToken = localStorage.getItem('accessToken')

          if (storedUser && accessToken) {
            const userData = JSON.parse(storedUser)
            setUser(userData)
          } else {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken: refreshTokenFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
