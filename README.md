<div align="center">

# 📷 SmartScanner Estoque

**App mobile que lê etiquetas de produtos com IA, monta listas de estoque e exporta tudo em CSV.**

![Expo](https://img.shields.io/badge/Expo-54-001122?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?logo=google&logoColor=white)
![Licença](https://img.shields.io/badge/Licença-MIT-green)

[English](./README.en.md) · Português

</div>

## Sobre

Empresas de elétrica e manutenção costumam conferir estoque contando etiquetas uma a uma — lento e propenso a erro. O **SmartScanner Estoque** troca essa rotina por um fluxo de três toques: fotografar a etiqueta, deixar a IA ler os dados e confirmar o item na lista.

O app captura a imagem da etiqueta, envia para **Google Gemini** (padrão) ou **OpenAI Vision** e devolve os campos já estruturados — descrição, modelo, cor, voltagem, marca e SKU. Itens repetidos são detectados e a quantidade é incrementada automaticamente. Ao final, a lista sai em **CSV** para qualquer planilha.

A chave de API é digitada pelo usuário dentro do app e guardada com **expo-secure-store** (criptografia nativa do sistema) — nenhum segredo fica no repositório ou em variável de ambiente.

## Funcionalidades

- **Leitura de etiquetas com IA** — Gemini ou OpenAI Vision extrai descrição, modelo, cor, voltagem, marca e SKU em JSON estruturado.
- **Sessão de escaneamento** — acumula itens, controla quantidade e detecta duplicatas automaticamente.
- **Listas salvas** — persiste sessões como listas, com edição e exclusão.
- **Exportação CSV** — leva listas e sessões direto para planilhas.
- **Configurações** — provedor de IA, modelo, chave da API, unidade padrão e preferências de escaneamento (som e vibração).
- **Validação de entrada** — schemas Zod para produtos, listas e chave de API.

## Stack

| Tecnologia | Para quê |
| --- | --- |
| [Expo SDK 54](https://expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) | Build e navegação file-based |
| React Native 0.81 / React 19 | Interface mobile |
| TypeScript (strict) | Tipagem em todo o código |
| `@google/genai` / REST OpenAI | Extração de dados das etiquetas por IA |
| `expo-secure-store` | Armazenamento criptografado da chave de API |
| AsyncStorage | Persistência de listas e sessões |
| Zod | Validação de todas as entradas |
| `expo-camera` / `expo-image-picker` | Captura da etiqueta |
| EAS Build | Builds Android e iOS na nuvem |

## Como rodar

### Pré-requisitos

- Node.js 18+
- Um aparelho Android/iOS com câmera (ou emulador)
- Chave de API do Google Gemini ou da OpenAI

### Instalação

```bash
git clone https://github.com/Diego-de-Melo/app-escaner.git
cd app-escaner/SmartScannerEstoque
npm install
```

### Execução

```bash
npx expo start           # servidor de desenvolvimento
npx expo run:android     # build nativo Android
npx expo run:ios         # build nativo iOS
```

Na primeira execução, abra a aba **Configurações** e informe a chave de API do provedor de IA escolhido.

### Build publicado

```bash
npx eas build --profile preview      # APK/para teste
npx eas build --profile production   # loja
```

## Estrutura do projeto

```text
SmartScannerEstoque/
├── app/                    # Telas (Expo Router)
│   ├── (tabs)/             # scanner, lists, settings
│   └── list/[id].tsx       # detalhe de uma lista
├── components/             # UI reutilizável (botão, input, modal, card)
├── src/
│   ├── context/            # estado global da sessão de escaneamento
│   ├── services/           # integrações de IA (Gemini, OpenAI)
│   ├── storage/            # persistência e geração de códigos
│   ├── types/              # modelos e schemas Zod
│   └── utils/              # exportação CSV
└── theme/                  # cores, tipografia e espaçamento
```

Documentação mais detalhada em [`SmartScannerEstoque/README.md`](./SmartScannerEstoque/README.md).

## Licença

Distribuído sob a licença MIT.
