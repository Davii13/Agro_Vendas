'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Leaf, Sprout, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr] bg-emerald-950">
      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white">
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-950 to-emerald-950"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-green-400/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-lg shadow-black/20">
            <img src="/logo.png" alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">AgroVendas</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
              CEASA Hortifruti
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-balance">
            Gestão completa para o seu hortifruti.
          </h2>
          <p className="text-emerald-200/80 text-base leading-relaxed">
            Controle vendas, fornecedores, entregas e o vale-caixa em um único
            painel, feito para o dia a dia da CEASA.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-300" />
              </div>
              <p className="text-sm text-emerald-100/90">Acompanhe vendas e recebimentos em tempo real</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Sprout className="h-4.5 w-4.5 text-emerald-300" />
              </div>
              <p className="text-sm text-emerald-100/90">Organize entregas e estoque por fornecedor</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Leaf className="h-4.5 w-4.5 text-emerald-300" />
              </div>
              <p className="text-sm text-emerald-100/90">Histórico completo de cada cliente, sempre à mão</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-emerald-400/60">
          © {new Date().getFullYear()} AgroVendas. Feito para produtores e comerciantes de hortifruti.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-md shadow-emerald-900/10 ring-1 ring-emerald-100">
              <img src="/logo.png" alt="AgroVendas" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-950">AgroVendas</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              CEASA Hortifruti
            </p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950">Bem-vindo de volta</h1>
            <p className="mt-1.5 text-sm text-slate-500">Entre com suas credenciais para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {erro && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{erro}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={carregando}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-slate-700">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={carregando}
                className="h-11"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="manterConectado"
                checked={manterConectado}
                onCheckedChange={setManterConectado}
                disabled={carregando}
              />
              <Label htmlFor="manterConectado" className="cursor-pointer font-normal text-slate-600">
                Manter-me conectado por 30 dias
              </Label>
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
