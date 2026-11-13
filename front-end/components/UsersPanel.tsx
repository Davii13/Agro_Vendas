'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Copy, Edit, KeyRound, MinusCircle, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { apiCall } from '@/lib/api'

type Papel = 'ADMIN' | 'OPERADOR'

type Usuario = {
  id: number
  email: string
  nome: string
  role: Papel
  ativo: boolean
}

type Credenciais = { titulo: string; email: string; senha: string }

const ROTULO_PAPEL: Record<Papel, string> = { ADMIN: 'Administrador', OPERADOR: 'Operador' }

// Letters and digits without look-alikes (no 0/O, 1/l/I), so it can be read out loud or typed from a note.
function gerarSenha(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const digitos = '23456789'
  const todos = letras + digitos
  const bytes = new Uint32Array(11)
  crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, (n) => todos[n % todos.length])
  chars[0] = letras[bytes[0] % letras.length]
  chars[1] = digitos[bytes[1] % digitos.length]
  return chars.join('')
}

async function mensagem(res: Response, padrao: string): Promise<string> {
  const corpo = await res.json().catch(() => null)
  return corpo?.erro || padrao
}

export function UsersPanel() {
  const { user: eu } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null)
  const [credenciais, setCredenciais] = useState<Credenciais | null>(null)

  const carregar = useCallback(async () => {
    setErroLista('')
    try {
      const res = await apiCall('/usuarios')
      if (res.ok) {
        setUsuarios(await res.json())
      } else {
        setErroLista(await mensagem(res, 'Não foi possível carregar os usuários.'))
      }
    } catch {
      setErroLista('Erro de conexão ao carregar os usuários.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const alternarAtivo = async (u: Usuario) => {
    const acao = u.ativo ? 'desativar' : 'ativar'
    const pergunta = u.ativo
      ? `Desativar ${u.nome}? A pessoa será desconectada e não poderá entrar até ser reativada.`
      : `Reativar ${u.nome}?`
    if (!confirm(pergunta)) return
    try {
      const res = await apiCall(`/usuarios/${u.id}/${acao}`, { method: 'PUT' })
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: u.ativo ? `${u.nome} foi desativado.` : `${u.nome} foi reativado.` })
        carregar()
      } else {
        setAviso({ tipo: 'erro', texto: await mensagem(res, 'Não foi possível alterar o acesso.') })
      }
    } catch {
      setAviso({ tipo: 'erro', texto: 'Erro de conexão.' })
    }
  }

  return (
    <section aria-labelledby="usuarios-titulo" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="usuarios-titulo" className="text-xl font-semibold text-slate-900">Quem pode entrar</h2>
          <p className="text-sm text-slate-600">
            Não existe cadastro público: só um administrador cria acessos. O operador lança vendas e entregas; o administrador também gerencia contas.
          </p>
        </div>
        <Button onClick={() => { setAviso(null); setCriando(true) }}>
          <Plus aria-hidden /> Novo usuário
        </Button>
      </div>

      {aviso && (
        <p
          role={aviso.tipo === 'erro' ? 'alert' : 'status'}
          className={`rounded-md border p-3 text-base ${aviso.tipo === 'erro' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {carregando && <p className="px-5 py-10 text-center text-base text-slate-600">Carregando...</p>}
        {!carregando && erroLista && (
          <div className="px-5 py-10 text-center">
            <p role="alert" className="text-base text-red-800">{erroLista}</p>
            <Button variant="outline" className="mt-3" onClick={() => { setCarregando(true); carregar() }}>Tentar de novo</Button>
          </div>
        )}
        {!carregando && !erroLista && usuarios.length === 0 && (
          <p className="px-5 py-10 text-center text-base text-slate-600">Nenhum usuário encontrado.</p>
        )}

        {usuarios.map((u) => {
          const sou = u.id === eu?.id
          return (
            <article key={u.id} className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-900">
                  {u.nome}{sou && <span className="ml-2 text-sm font-normal text-slate-600">(você)</span>}
                </h3>
                <p className="truncate text-base text-slate-700">{u.email}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                    <ShieldCheck className="h-4 w-4" aria-hidden /> {ROTULO_PAPEL[u.role]}
                  </span>
                  {u.ativo ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" aria-hidden /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                      <MinusCircle className="h-4 w-4" aria-hidden /> Desativado
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setAviso(null); setEditando(u) }}>
                  <Edit aria-hidden /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setAviso(null); setRedefinindo(u) }}>
                  <KeyRound aria-hidden /> Nova senha
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sou && u.ativo}
                  title={sou ? 'Você não pode desativar a própria conta' : undefined}
                  onClick={() => alternarAtivo(u)}
                  className={u.ativo ? 'text-red-700 hover:border-red-300 hover:bg-red-50' : 'text-emerald-700'}
                >
                  {u.ativo ? 'Desativar' : 'Reativar'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      <NovoUsuarioDialog
        open={criando}
        onClose={() => setCriando(false)}
        onCriado={(c) => { setCriando(false); setCredenciais(c); carregar() }}
      />
      <EditarUsuarioDialog
        usuario={editando}
        souEu={editando?.id === eu?.id}
        onClose={() => setEditando(null)}
        onSalvo={(texto) => { setEditando(null); setAviso({ tipo: 'ok', texto }); carregar() }}
      />
      <NovaSenhaDialog
        usuario={redefinindo}
        onClose={() => setRedefinindo(null)}
        onRedefinida={(c) => { setRedefinindo(null); setCredenciais(c); carregar() }}
      />
      <CredenciaisDialog credenciais={credenciais} onClose={() => setCredenciais(null)} />
    </section>
  )
}

// ---------------------------------------------------------------- create

function NovoUsuarioDialog({ open, onClose, onCriado }: { open: boolean; onClose: () => void; onCriado: (c: Credenciais) => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<Papel>('OPERADOR')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (open) {
      setNome(''); setEmail(''); setSenha(gerarSenha()); setRole('OPERADOR'); setErro('')
    }
  }, [open])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const res = await apiCall('/usuarios', { method: 'POST', body: JSON.stringify({ nome, email, senha, role }) })
      if (res.ok) {
        onCriado({ titulo: 'Usuário criado', email: email.trim(), senha })
      } else {
        setErro(await mensagem(res, 'Não foi possível criar o usuário.'))
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
        <form onSubmit={enviar} className="space-y-4 py-2" noValidate>
          {erro && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-base text-red-800">{erro}</p>}
          <div className="space-y-2">
            <Label htmlFor="novo-nome">Nome</Label>
            <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="novo-email">Login: e-mail ou nome de usuário</Label>
            <Input id="novo-email" type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
            <p className="text-sm text-slate-600">Quem não tem e-mail pode ter só um nome, como &ldquo;pai&rdquo; ou &ldquo;maria.silva&rdquo;. Sem espaços. Maiúsculas e minúsculas tanto faz.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="novo-senha">Senha provisória</Label>
            <div className="flex gap-2">
              <Input id="novo-senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" spellCheck={false} className="font-medium" required />
              <Button type="button" variant="outline" onClick={() => setSenha(gerarSenha())}>Gerar</Button>
            </div>
            <p className="text-sm text-slate-600">Pelo menos 8 caracteres, com letras e números. Depois a pessoa pode trocar em &ldquo;Alterar senha&rdquo;.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="novo-papel">Tipo de acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Papel)}>
              <SelectTrigger id="novo-papel"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERADOR">Operador: lança vendas e entregas</SelectItem>
                <SelectItem value="ADMIN">Administrador: também gerencia usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={enviando}>{enviando ? 'Criando...' : 'Criar usuário'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------- edit

function EditarUsuarioDialog({ usuario, souEu, onClose, onSalvo }: { usuario: Usuario | null; souEu: boolean; onClose: () => void; onSalvo: (texto: string) => void }) {
  const [nome, setNome] = useState('')
  const [role, setRole] = useState<Papel>('OPERADOR')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (usuario) { setNome(usuario.nome); setRole(usuario.role); setErro('') }
  }, [usuario])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return
    setErro('')
    setEnviando(true)
    try {
      const res = await apiCall(`/usuarios/${usuario.id}`, { method: 'PUT', body: JSON.stringify({ nome, role }) })
      if (res.ok) {
        onSalvo(`Dados de ${nome.trim()} atualizados.`)
      } else {
        setErro(await mensagem(res, 'Não foi possível salvar.'))
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
        {usuario && (
          <form onSubmit={enviar} className="space-y-4 py-2" noValidate>
            {erro && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-base text-red-800">{erro}</p>}
            <p className="text-base text-slate-700">{usuario.email}</p>
            <div className="space-y-2">
              <Label htmlFor="ed-nome">Nome</Label>
              <Input id="ed-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-papel">Tipo de acesso</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Papel)}>
                <SelectTrigger id="ed-papel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERADOR">Operador</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {souEu && <p className="text-sm text-slate-600">Ao tirar o seu próprio acesso de administrador, você perde este painel.</p>}
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar'}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------- reset password

function NovaSenhaDialog({ usuario, onClose, onRedefinida }: { usuario: Usuario | null; onClose: () => void; onRedefinida: (c: Credenciais) => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (usuario) { setSenha(gerarSenha()); setErro('') }
  }, [usuario])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return
    setErro('')
    setEnviando(true)
    try {
      const res = await apiCall(`/usuarios/${usuario.id}/redefinir-senha`, { method: 'PUT', body: JSON.stringify({ novaSenha: senha }) })
      if (res.ok) {
        onRedefinida({ titulo: 'Senha redefinida', email: usuario.email, senha })
      } else {
        setErro(await mensagem(res, 'Não foi possível redefinir a senha.'))
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader><DialogTitle>Nova senha para {usuario?.nome}</DialogTitle></DialogHeader>
        <form onSubmit={enviar} className="space-y-4 py-2" noValidate>
          {erro && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-base text-red-800">{erro}</p>}
          <div className="space-y-2">
            <Label htmlFor="rs-senha">Nova senha provisória</Label>
            <div className="flex gap-2">
              <Input id="rs-senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" spellCheck={false} className="font-medium" required />
              <Button type="button" variant="outline" onClick={() => setSenha(gerarSenha())}>Gerar</Button>
            </div>
            <p className="text-sm text-slate-600">Pelo menos 8 caracteres, com letras e números. A pessoa é desconectada de todos os aparelhos e entra com esta senha.</p>
          </div>
          <Button type="submit" className="w-full" disabled={enviando}>{enviando ? 'Salvando...' : 'Redefinir senha'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------- credentials to hand over

function CredenciaisDialog({ credenciais, onClose }: { credenciais: Credenciais | null; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { if (credenciais) setCopiado(false) }, [credenciais])

  const copiar = async () => {
    if (!credenciais) return
    try {
      await navigator.clipboard.writeText(`Login: ${credenciais.email}\nSenha: ${credenciais.senha}`)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Dialog open={credenciais !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader><DialogTitle>{credenciais?.titulo}</DialogTitle></DialogHeader>
        {credenciais && (
          <div className="space-y-4 py-2">
            <p className="text-base text-slate-700">Passe estes dados para a pessoa. Por segurança, a senha <strong>não aparece de novo</strong> depois que você fechar.</p>
            <dl className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div>
                <dt className="text-sm text-slate-600">Login</dt>
                <dd className="break-all text-lg font-semibold text-slate-900">{credenciais.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Senha</dt>
                <dd className="text-lg font-semibold tracking-wide text-slate-900">{credenciais.senha}</dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copiar}>
                <Copy aria-hidden /> {copiado ? 'Copiado' : 'Copiar'}
              </Button>
              <Button className="flex-1" onClick={onClose}>Pronto</Button>
            </div>
            {copiado && <p role="status" className="inline-flex items-center gap-1.5 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden />Copiado para a área de transferência.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
