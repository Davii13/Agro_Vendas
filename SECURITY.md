# Segurança do AgroVendas

Estado após a correção das vulnerabilidades da auditoria (AGV-01 a AGV-24). Este documento separa
três coisas que não devem ser confundidas:

- **Corrigida e validada**: a correção está no código **e** foi provada por teste automatizado e/ou por execução no ambiente real.
- **Parcial**: parte do risco foi tratada; o que falta está descrito.
- **Pendente / adiada**: não corrigida, com o motivo.

Passar nos testes não torna o sistema seguro: veja "Riscos residuais" no fim.

## Status por vulnerabilidade

| ID | Sev. | Vulnerabilidade | Status | Como foi validado |
|---|---|---|---|---|
| AGV-01 | Crítica | Cadastro público (`/api/auth/register`) | **Corrigida e validada** | Rota removida; anônimo recebe 401 e nenhuma conta é criada. Teste automatizado e verificação no Docker |
| AGV-02 | Crítica | Qualquer usuário gerencia todas as contas | **Corrigida e validada** | `/api/usuarios/**` só para `ADMIN`; operador recebe 403 (inclusive em servidor HTTP real); rota antiga `/alterar-senha` removida |
| AGV-03 | Crítica | Segredo JWT padrão público | **Corrigida e validada** | Sem valor padrão; a aplicação não inicia sem `JWT_SECRET` aleatório de 64+ bytes e recusa o segredo antigo; token forjado com o segredo antigo recebe 401 |
| AGV-04 | Alta | Refresh token valia como access token; logout ineficaz | **Corrigida e validada** | Tipo do token é claim assinada; refresh como Bearer recebe 401, access em `/refresh` recebe 401, logout revoga |
| AGV-05 | Alta | Usuário desativado continuava com acesso | **Corrigida e validada** | O filtro confere o banco a cada chamada (ativo, papel, versão do token); desativar ou trocar senha invalida access e refresh na hora |
| AGV-06 | Alta | XSS armazenado no histórico e no PDF | **Corrigida e validada** | Todo texto vindo do banco é escapado (`lib/customerHistoryHtml.ts`); 7 testes, que falham sem o escape. **Não** exercitei a impressão/PDF em navegador real |
| AGV-07 | Alta | Valores financeiros sem validação | **Corrigida e validada** | Total, valor pago, status e caixas devendo são calculados no servidor; 14 testes e 16 verificações no Docker |
| AGV-08 | Alta | Sem limite de tentativas nem política de senha | **Corrigida e validada** | 5 falhas por e-mail (30 por IP) em 15 min viram 429 com `Retry-After`; senha nova exige 8+ caracteres, letras e números. Só vale para senhas **novas** |
| AGV-09 | Alta | Sem separação de dados entre usuários | **Aceito por projeto, mitigado** | O sistema é de um único negócio. Mitigações: cadastro fechado, papéis, entrega presa ao próprio produtor. Todo usuário ativo continua vendo e editando todos os dados |
| AGV-10 | Média | Dependências vulneráveis | **Parcial** | Front: `npm audit` = 0 vulnerabilidades de produção (Next 16.4.6, `xlsx` 0.20.3, `zod` e `dompurify` resolvidos, `@vercel/analytics` removido). Back: Spring Boot 3.5.16 e jjwt 0.12.6, **sem scanner de CVE executado** |
| AGV-11 | Média | Credenciais fracas e banco como superusuário | **Parcial** | Papel `agrovendas_app` sem superusuário e com senhas aleatórias, validado nas duas rotas (banco existente e instalação nova). **Falta** privilégio só de leitura e escrita (ver abaixo) |
| AGV-12 | Média | Sem HTTPS nem cabeçalhos | **Parcial** | Cabeçalhos e CSP no front e na API, validados no navegador (0 violações). **HTTPS não configurado nem testado** (sem domínio) |
| AGV-13 | Média | Tokens em `localStorage` | **Adiada por decisão** | Migrar para cookie `HttpOnly` exige CSRF e mesma origem. Reduzido por: XSS corrigido, CSP, access token de 15 min, invalidação por versão |
| AGV-14 | Média | Concorrência sem controle | **Pendente** | Sem `@Version`; vale a última gravação |
| AGV-15 | Baixa | Enumeração de usuários | **Corrigida e validada** | Mensagem única; tempo de resposta equivalente (~65–80 ms nos dois casos); sem cadastro público |
| AGV-16 | Baixa | Logs com dados pessoais | **Corrigida** | `show-sql` desligado; e-mails e segredos não são logados. Conferido por leitura do código, sem auditoria de logs em produção |
| AGV-17 | Baixa | Containers como root | **Corrigida e validada** | `id` dentro dos containers: `agrovendas` (999) e `node` (1000) |
| AGV-18 | Baixa | Entrada inválida vira 500 | **Corrigida e validada** | JSON ruim, data ruim e id ruim viram 400; inexistente vira 404; conflito vira 409 |
| AGV-19 | Baixa | JWT incompleto | **Parcial** | Adicionados emissor, audiência, `jti`, tipo e versão; e-mail e nome saíram do token. **Falta** rotação de refresh token e limpeza de tokens expirados |
| AGV-20 | Baixa | CORS duplicado com origens de desenvolvimento | **Corrigida e validada** | Uma configuração, vinda de `CORS_ALLOWED_ORIGINS`; origem estranha recebe 403 |
| AGV-21 | Info | `ddl-auto=update` em produção | **Pendente** | Depende do trabalho de AGV-11 |
| AGV-22 | Info | Sem testes de segurança | **Corrigida** | 49 testes no back-end e 7 no front-end |
| AGV-23 | Info | CSRF desligado | **Documentado** | Aceitável enquanto a autenticação for por cabeçalho `Authorization`. **Reavaliar** se os tokens forem para cookies |
| AGV-24 | Info | Entidades JPA nas respostas | **Parcial** | `POST` de entrega agora devolve DTO (a resposta antiga saía com JSON quebrado). Venda, cliente, fornecedor e mercadoria ainda devolvem a entidade |

## Testes

| Suíte | Resultado |
|---|---|
| Back-end (JUnit, banco H2 em memória) | **49 passam** |
| Front-end (`npm test`, executor nativo do Node) | **7 passam** |
| Verificações no Docker, etapa 1 (autenticação e autorização) | **29 de 29** |
| Verificações no Docker, etapa 2 (regras financeiras) | **16 de 16** |
| Navegador headless com CSP ativo | **0 problemas** no console |

Os testes de segurança foram **mutados** para provar que protegem de verdade: remover a checagem do tipo do token, a do estado do usuário, o limitador, o cálculo financeiro e o escape de HTML fez os testes correspondentes falharem.

Um defeito só apareceu em servidor real: com `response.sendError`, todo 403 virava 401. Por isso existe `RealServerSecurityTest`, que usa HTTP de verdade.

## Riscos residuais

1. **O segredo JWT antigo continua no histórico do git.** Está invalidado aqui, mas qualquer outro ambiente que o use deve ser tratado como comprometido e trocado.
2. **Senhas existentes não foram forçadas a mudar.** A política vale só para senhas novas. A conta `davi@gmail.com` ainda usa uma senha fraca: troque-a em "Alterar senha".
3. **O papel do banco ainda pode alterar o esquema** (é dono do banco, por causa do `ddl-auto=update`). Um comprometimento da aplicação ainda permite apagar ou alterar tabelas.
4. **Sem HTTPS validado.** Tráfego e tokens só estão protegidos em trânsito depois de configurar TLS.
5. **Tokens ainda em `localStorage`.** Um XSS futuro leria os tokens. O CSP atual mantém `'unsafe-inline'` em scripts.
6. **O limitador de tentativas é por processo.** Com várias réplicas, cada uma conta separado; atrás de proxy, é preciso `FORWARD_HEADERS_STRATEGY=native`. Um atacante também pode bloquear temporariamente uma conta alheia errando a senha dela.
7. **Vendas antigas** gravadas como "Pago" podem ter `valor_pago = 99999`. O servidor passa a gravar o total certo só ao salvar a venda de novo.
8. **Dependências do back-end não foram analisadas por scanner de CVE.** Rode o OWASP Dependency-Check.
9. **Concorrência, rotação de refresh token e limpeza de tokens expirados** continuam pendentes.
10. **Qualquer usuário ativo vê e altera todos os dados do negócio.**

## Configuração segura para produção

1. **Segredos.** Copie `.env.example` para `.env` (o git ignora) e gere cada valor com `openssl rand -base64 48`; `JWT_SECRET` com `openssl rand -base64 64`. Nunca coloque esses valores no código nem no repositório.
2. **Primeiro administrador.** Defina `ADMIN_EMAIL` (e `ADMIN_PASSWORD` se a conta ainda não existir). Só atua enquanto não houver ADMIN ativo.
3. **Criar usuários** (só ADMIN). O jeito mais simples é o painel **"Usuários e acessos"** no menu do site (aparece só para administradores): criar, editar, gerar senha provisória, redefinir senha e desativar. O login pode ser um e-mail **ou um nome de usuário simples** (3 a 150 caracteres entre letras, números e `. _ - @ +`, sem espaços), e maiúsculas e minúsculas tanto faz. Pela API:
   ```
   curl -X POST https://SEU-DOMINIO/api/usuarios \
     -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
     -d '{"email":"pai@exemplo.com","senha":"UmaSenha2026Forte","nome":"Pai","role":"OPERADOR"}'
   ```
   Para redefinir: `PUT /api/usuarios/{id}/redefinir-senha` com `{"novaSenha":"..."}`. Desativar e ativar: `PUT /api/usuarios/{id}/desativar` e `/ativar`.
4. **HTTPS.** Termine TLS num proxy reverso (por exemplo Caddy ou nginx com certificado automático) e **exponha só as portas 80/443**. As portas 3000 e 8080 devem ficar internas. Depois ajuste `CORS_ALLOWED_ORIGINS` e `NEXT_PUBLIC_API_URL` para os endereços `https://`, reconstrua o front e defina `FORWARD_HEADERS_STRATEGY=native`. (Não testei esta etapa: não há domínio neste ambiente.)
5. **Banco.** O usuário do banco **nunca** é o superusuário. Em banco novo, `db/init/01-app-role.sh` cria o papel da aplicação. Em banco já existente, use `db/existing-database.sql` (cria o papel, transfere a propriedade sem alterar dados e troca a senha do superusuário); faça backup antes.
6. **Não publique a porta do banco.** O compose não a publica; mantenha assim.
7. **Backups** do volume do banco, guardados fora da máquina e com acesso restrito.
8. **Rotina.** Rode `npm audit` e o OWASP Dependency-Check a cada release e rode os testes (`mvn test` e `npm test`) antes de publicar.
9. **Troque as senhas fracas existentes** e, depois da primeira configuração, remova `ADMIN_PASSWORD` do `.env`.
