# SmartScanner Estoque

Expo SDK 54 · React 19.1 · React Native 0.81.5 · TypeScript strict
Read Expo v54 docs: https://docs.expo.dev/versions/v54.0.0/

## Commands

```bash
npx expo start              # dev server
npx expo run:android        # native Android build
npx expo run:ios            # native iOS build
npx expo prebuild --clean   # regenerate android/ and ios/ folders
```

EAS CLI ≥ 20.5.1 required for builds (`eas build`).

## Architecture

- **Routing:** Expo Router file-based. Entry → `app/_layout.tsx` (Stack) → `app/(tabs)/_layout.tsx` (Tabs: scanner, lists, settings).
- **Global state:** `ScanSessionProvider` in `app/_layout.tsx` wraps entire app. Access via `useScanSession()` from `src/context/ScanSession.tsx`.
- **Storage:** AsyncStorage-backed. `src/storage/ProductStorage.ts` handles settings, saved lists, and product code generation.
- **AI service:** `src/services/AILabelService.ts` — OpenAI Vision API (GPT-4o-mini default). API key configured in-app via Settings screen, NOT via env vars.
- **Export:** CSV via `expo-file-system/next` + `expo-sharing`. See `src/utils/ExcelExport.ts`.

## Directory Layout

```
app/              # Expo Router screens (_layout, index, tabs/, list/)
components/       # Shared UI (AppButton, AppInput, AppModal, Card, EmptyState)
src/context/      # React Context providers
src/services/     # External API integrations (AI)
src/storage/      # AsyncStorage persistence layer
src/types/        # TypeScript interfaces (Product, SavedList, etc.)
src/utils/        # CSV export helpers
theme/            # Colors, Typography, Spacing, Radius constants
```

## Conventions

- Named exports for components (`export const Foo`). Avoid `export default`.
- Strict TypeScript. All props via interfaces.
- Dark-only theme. Colors from `theme/colors.ts`, never hardcoded hex.
- UI strings in Portuguese (pt-BR).
- `.npmrc` sets `legacy-peer-deps=true` — respect this if modifying dependencies.
- `.easignore` excludes `android/` and `ios/` from EAS builds.

## Gotchas

- `.agents/skills/rn-copilot/SKILL.md` defines RNCopilot patterns — follow these for new components/screens.
- `CLAUDE.md` just references `@AGENTS.md`.
- No lint, test, or typecheck scripts in package.json — run `npx tsc --noEmit` for type checking.
- `app/index.tsx` is a redirect shim to `/scanner`; do not add logic there.
- Product codes are deterministic hashes (`PRD<hash>`) — duplicates auto-merge quantities.
