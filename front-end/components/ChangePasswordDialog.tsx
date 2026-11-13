'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { apiCall } from '@/lib/api'

const MIN_LENGTH = 8

// The server enforces the real policy; this only saves a round trip for obvious mistakes.
function problemaNaSenha(nova: string, confirmacao: string): string | null {
  if (nova.length < MIN_LENGTH) return `A nova senha deve ter pelo menos ${MIN_LENGTH} caracteres.`
  if (!/[A-Za-zÀ-ÿ]/.test(nova) || !/[0-9]/.test(nova)) return 'A nova senha deve ter letras e números.'
  if (nova !== confirmacao) return 'A confirmação não é igual à nova senha.'
  return null
}

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()

  const reset = () => {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    setErro('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problema = problemaNaSenha(novaSenha, confirmacao)
    if (problema) {
      setErro(problema)
      return
    }
    setErro('')
    setEnviando(true)
    try {
      const res = await apiCall('/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      if (res.ok) {
        // Changing the password ends every session of the account, this one included.
        await logout()
        router.push('/login')
        return
      }
      const body = await res.json().catch(() => null)
      setErro(body?.erro || 'Não foi possível alterar a senha.')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-emerald-100 hover:bg-white/10 hover:text-white">
          <KeyRound className="mr-1 h-5 w-5" aria-hidden />
          Alterar senha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {erro && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-base text-red-800">
              {erro}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="senha-atual">Senha atual</Label>
            <Input id="senha-atual" type="password" autoComplete="current-password" value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova senha</Label>
            <Input id="nova-senha" type="password" autoComplete="new-password" value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)} required />
            <p className="text-sm text-slate-600">Pelo menos 8 caracteres, com letras e números.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Repita a nova senha</Label>
            <Input id="confirmar-senha" type="password" autoComplete="new-password" value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)} required />
          </div>
          <p className="text-sm text-slate-600">Depois de trocar, você será desconectado e entra de novo com a nova senha.</p>
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
