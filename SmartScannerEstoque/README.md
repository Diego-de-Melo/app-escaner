# SmartScanner Estoque

App mobile para escaneamento de etiquetas de produtos com IA, criado com Expo e React Native.

## Funcionalidades

- **Escaneamento com IA** - Captura imagens de etiquetas e usa Google Gemini (padrão) ou OpenAI Vision (GPT-4o-mini) para extrair dados do produto automaticamente
- **Sessao de escaneamento** - Acumula itens escaneados, com controle de quantidade e deteccao de duplicatas
- **Listas salvas** - Salva sessoes como listas persistentes, com edicao e exclusao
- **Exportacao CSV** - Exporta listas e sessoes em formato CSV para uso em planilhas
- **Configuracoes** - API key da OpenAI, modelo de IA, unidade padrao, preferencias de escaneamento

## Stack

- Expo SDK 54
- React Native 0.81.5
- React 19.1
- TypeScript (strict)
- Expo Router (file-based routing)
- AsyncStorage (persistencia)
- expo-secure-store (armazenamento seguro de chaves)
- Zod (validacao de entradas)
- Google Gemini API (provedor padrao) e OpenAI Vision API (extracao de etiquetas)

## Pre-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Dispositivo ou emulador com acesso a camera
- Chave de API Google Gemini ou OpenAI (configurada nas configuracoes do app)

## Instalacao

```bash
cd SmartScannerEstoque
npm install
```

## Execucao

```bash
npx expo start           # Inicia o servidor de desenvolvimento
npx expo run:android     # Build nativo Android
npx expo run:ios         # Build nativo iOS
```

## Build com EAS

```bash
npx eas build --profile development    # Build de desenvolvimento
npx eas build --profile preview        # Build de preview
npx eas build --profile production     # Build de producao
```

## Estrutura do Projeto

```
app/                    # Telas Expo Router
  _layout.tsx           # Layout raiz (Stack)
  index.tsx             # Redirect para /scanner
  (tabs)/               # Navegacao por abas
    _layout.tsx         # Layout das abas
    scanner.tsx         # Tela principal de escaneamento
    lists.tsx           # Listas salvas
    settings.tsx        # Configuracoes
  list/
    [id].tsx            # Detalhe/edicao de uma lista

components/             # Componentes UI reutilizables
  AppButton.tsx
  AppInput.tsx
  AppModal.tsx
  Card.tsx
  EmptyState.tsx

src/
  context/              # React Context (estado global)
    ScanSession.tsx     # Sessao de escaneamento
  services/             # Integracoes externas
    AILabelService.ts   # Servico OpenAI Vision
    GeminiService.ts    # Servico Google Gemini
  storage/              # Persistencia AsyncStorage
    ProductStorage.ts   # Configuracoes, listas, geracao de codigos
  types/                # Definicoes TypeScript
    Product.ts
  utils/                # Helpers
    ExcelExport.ts      # Exportacao CSV

theme/                  # Sistema de temas
  colors.ts
  typography.ts
  spacing.ts
```

## Como Funciona

1. O usuario tira uma foto da etiqueta do produto
2. A imagem e enviada para a API OpenAI Vision
3. A IA extrai: descricao, modelo, cor, voltagem, marca, SKU
4. O usuario confirma/edita os dados e adiciona a sessao
5. Itens duplicados sao detectados automaticamente (quantidade incrementada)
6. A sessao pode ser salva como lista e exportada como CSV

## Observacoes

- A chave da API (Gemini ou OpenAI) e configurada diretamente no app (tela Configuracoes), nao via variavel de ambiente
- O provedor de IA e o modelo sao escolhidos em Configuracoes; Gemini e o padrao
- A interface e exclusivamente dark mode
- Textos da interface estao em portugues (pt-BR)
- Codigos de produto sao hashes deterministas (`PRD<hash>`) - duplicatas incrementam quantidade automaticamente

## Seguranca React (OWASP)

### Protecao contra Cross-Site Scripting (XSS)
- Usar vinculacao padrao do JSX `{dados}` para escape automatico de texto
- PROIBIDO usar `dangerouslySetInnerHTML`. Se necessario renderizar HTML, usar `dompurify` para sanitizacao
- Validar URLs antes de passar para tags `<a href={...}>` ou `<iframe src={...}>` para bloquear injecoes com protocolo `javascript:`

### Gestao de Dados Sensiveis e Variaveis de Ambiente
- API key da OpenAI armazenada com `expo-secure-store` (encriptacao nativa do SO)
- Chaves NUNCA em texto plano no AsyncStorage ou em codigo fonte
- Em mobile: chave e digitada pelo usuario e salva de forma segura

### Validacao de Entradas (Inputs)
- Todos os formularios validados com `Zod` antes de persistir
- Schemas em `src/types/validation.ts`:
  - `ProductFormDataSchema` - validacao de produtos
  - `ApiKeySchema` - validacao de chave OpenAI (formato `sk-...`)
  - `ListNameSchema` - validacao de nome de listas
  - `QuantitySchema` - validacao de quantidades (0-99999)

### Manipulacao de DOM
- Evitar manipulacao direta do DOM via `document.getElementById` ou uso inseguro de `useRef.current` para injetar elementos diretamente
- Priorizar sempre o estado reativo do React

## Licenca

MIT
