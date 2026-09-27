<div align="center">

# 📷 SmartScanner Estoque

**A mobile app that reads product labels with AI, builds inventory lists and exports everything to CSV.**

![Expo](https://img.shields.io/badge/Expo-54-001122?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Português · [English](./README.en.md)

</div>

## About

Electrical and maintenance suppliers usually count stock label by label — slow and error-prone. **SmartScanner Estoque** replaces that routine with a three-tap flow: take a photo of the label, let the AI read the data, confirm the item in the list.

The app captures the label image, sends it to **Google Gemini** (default) or **OpenAI Vision**, and gets structured fields back — description, model, color, voltage, brand and SKU. Duplicates are detected and the quantity is incremented automatically. In the end, the list exports to **CSV** for any spreadsheet.

The API key is typed by the user inside the app and stored with **expo-secure-store** (native OS encryption) — no secret lives in the repository or in environment variables.

## Features

- **AI label reading** — Gemini or OpenAI Vision extracts description, model, color, voltage, brand and SKU into structured JSON.
- **Scan session** — accumulates items, tracks quantities and detects duplicates automatically.
- **Saved lists** — persists sessions as lists, with editing and deletion.
- **CSV export** — sends lists and sessions straight to spreadsheets.
- **Settings** — AI provider, model, API key, default unit and scan preferences (sound and vibration).
- **Input validation** — Zod schemas for products, lists and API keys.

## Stack

| Technology | Purpose |
| --- | --- |
| [Expo SDK 54](https://expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) | Builds and file-based navigation |
| React Native 0.81 / React 19 | Mobile interface |
| TypeScript (strict) | Typing across the whole codebase |
| `@google/genai` / OpenAI REST | AI-powered label data extraction |
| `expo-secure-store` | Encrypted API key storage |
| AsyncStorage | List and session persistence |
| Zod | Validation of every input |
| `expo-camera` / `expo-image-picker` | Label capture |
| EAS Build | Cloud Android and iOS builds |

## Getting started

### Prerequisites

- Node.js 18+
- An Android/iOS device with a camera (or an emulator)
- A Google Gemini or OpenAI API key

### Install

```bash
git clone https://github.com/Diego-de-Melo/app-escaner.git
cd app-escaner/SmartScannerEstoque
npm install
```

### Run

```bash
npx expo start           # development server
npx expo run:android     # native Android build
npx expo run:ios         # native iOS build
```

On first launch, open the **Settings** tab and enter the API key for your chosen AI provider.

### Published build

```bash
npx eas build --profile preview      # test build
npx eas build --profile production   # store release
```

## Project structure

```text
SmartScannerEstoque/
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/             # scanner, lists, settings
│   └── list/[id].tsx       # list detail
├── components/             # Reusable UI (button, input, modal, card)
├── src/
│   ├── context/            # Global scan-session state
│   ├── services/           # AI integrations (Gemini, OpenAI)
│   ├── storage/            # Persistence and code generation
│   ├── types/              # Models and Zod schemas
│   └── utils/              # CSV export
└── theme/                  # Colors, typography and spacing
```

More detailed documentation in [`SmartScannerEstoque/README.md`](./SmartScannerEstoque/README.md) (Portuguese).

## License

Distributed under the MIT license.
