# Vortex MEC — Frontend

Interface web do **Vortex MEC**, sistema de gerenciamento de oficina mecânica. Consome a API REST do `mec-backend` com autenticação JWT e controle de acesso por perfil.

## Stack

- **React 19** + **TypeScript**
- **Vite 8** — build e dev server
- **React Router 7** — rotas públicas e privadas
- **Zod** — validação de formulários
- **Lucide React** — ícones
- **Oxlint** — linting

## Funcionalidades

| Módulo | Rota | Perfis |
|--------|------|--------|
| Login e primeiro acesso | `/login` | Público |
| Dashboard | `/` | Todos autenticados |
| Meu perfil | `/perfil` | Todos autenticados |
| Clientes | `/clientes` | ADMIN, TECNICO |
| Veículos | `/veiculos` | ADMIN, TECNICO |
| Ordens de serviço | `/ordens-servico` | ADMIN, TECNICO |
| Usuários | `/usuarios` | ADMIN |

### Destaques

- Autenticação JWT com refresh automático de token
- Fluxo de **primeiro acesso** (verificar e-mail → definir senha)
- Edição de **perfil** (nome, e-mail) e **troca de senha** com renovação de sessão
- Cadastro de cliente com endereço (CEP automático + municípios por UF)
- Opção de cadastrar veículo junto com o cliente
- Máscaras para CPF/CNPJ, telefone, CEP e placa
- UI com efeito *liquid glass* e layout responsivo (desktop, tablet e mobile)

## Pré-requisitos

- [Bun](https://bun.sh) (ou Node.js 20+)
- Backend `mec-backend` rodando em `http://localhost:8080`

## Instalação

```bash
bun install
```

## Variáveis de ambiente

Copie ou ajuste o arquivo `.env`:

```env
# Deixe vazio no desenvolvimento para usar o proxy do Vite (/api -> localhost:8080)
VITE_API_URL=
```

Em produção (`.env.production`), aponte para a URL da API:

```env
VITE_API_URL=https://sua-api.exemplo.com
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `bun dev` | Servidor de desenvolvimento (porta 5173) |
| `bun run build` | Type-check + build de produção |
| `bun run preview` | Preview do build |
| `bun run lint` | Executa o Oxlint |

## Proxy de desenvolvimento

No modo dev, requisições para `/api` são encaminhadas ao backend via proxy configurado em `vite.config.ts`:

```
/api/*  →  http://localhost:8080/api/*
```

Com `VITE_API_URL` vazio, o cliente usa caminhos relativos (`/api/...`) e o proxy do Vite cuida do resto.

## Estrutura do projeto

```
src/
├── api/              # Cliente HTTP, auth, endpoints
├── components/       # UI reutilizável, formulários, layout
├── contexts/         # Auth, clientes, veículos, ordens de serviço
├── pages/            # Páginas da aplicação
├── routes/           # Rotas, guards e paths
├── schemas/          # Schemas Zod
├── types/            # Tipos e mapeadores da API
└── utils/            # Máscaras, permissões, formatação
```

## Integração com a API

Principais endpoints utilizados:

| Área | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET/PUT /api/auth/me`, `PUT /api/auth/me/senha` |
| Primeiro acesso | `POST /api/auth/verificar-primeiro-acesso`, `POST /api/auth/primeiro-acesso` |
| Clientes | `GET/POST/PUT/DELETE /api/clientes` |
| Veículos | `GET/POST/PUT/DELETE /api/veiculos` |
| Ordens de serviço | `GET/POST/PUT/DELETE /api/ordens-servico` |
| Usuários | `GET/POST/PUT/DELETE /api/usuarios` |
| Localidades | `GET /api/localidades/estados/{uf}/municipios` (público) |

## Perfis de acesso

| Perfil | Permissões |
|--------|------------|
| **ADMIN** | Acesso total, incluindo gestão de usuários |
| **TECNICO** | Clientes, veículos e ordens de serviço |
| **CLIENTE** | Dashboard e edição do próprio perfil |

## Desenvolvimento

1. Suba o backend na porta `8080`
2. Execute `bun dev`
3. Acesse `http://localhost:5173`

Para editar o perfil logado, clique no nome/avatar na barra lateral ou acesse `/perfil`.
