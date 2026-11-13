'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterConectado, setManterConectado] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await login(email, senha, manterConectado)
      router.push('/')
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel: desktop only */}
      <div className="hidden flex-col justify-between bg-emerald-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white p-1">
            <img src="/logo-mark.png" alt="" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-semibold tracking-tight">AgroVendas</p>
            <p className="text-sm text-emerald-200">CEASA Hortifruti</p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight">
            A planilha do dia, o que cada produtor recebeu e o que ainda falta pagar.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-100">
            Vendas, entregas, vales de caixa 6424 e clientes num só lugar, feito para o balcão.
          </p>
        </div>

        <p className="text-sm text-emerald-200">&copy; {new Date().getFullYear()} AgroVendas</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5">
              <img src="/logo-mark.png" alt="" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-xl font-semibold tracking-tight text-slate-900">AgroVendas</p>
              <p className="text-sm text-slate-600">CEASA Hortifruti</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar</h1>
          <p className="mt-1 text-base text-slate-600">Use o usuário (ou e-mail) e a senha do seu cadastro.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            {erro && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3.5 text-base text-red-800"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <span>{erro}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Usuário ou e-mail</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="seu usuário ou e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={carregando}
                className="h-12"
                aria-invalid={erro ? true : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  disabled={carregando}
                  className="h-12 pr-14"
                  aria-invalid={erro ? true : undefined}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-slate-600 hover:text-slate-900"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="manterConectado"
                checked={manterConectado}
                onCheckedChange={setManterConectado}
                disabled={carregando}
              />
              <Label htmlFor="manterConectado" className="cursor-pointer text-base font-normal text-slate-700">
                Manter-me conectado por 30 dias
              </Label>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
