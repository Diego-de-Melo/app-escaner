---
name: rn-copilot
description: Regras e padroes de arquitetura para criar codigo React Native com Expo baseados no template RNCopilot. Ative sempre que o usuario pedir componentes, telas ou rotas de app mobile.
---

# Diretrizes RNCopilot para React Native

Sempre que criar novos arquivos, componentes ou telas neste projeto, voce deve seguir estritamente os padroes do ecossistema RNCopilot:

## 1. Stack Tecnologica & Estrutura
- **Framework:** React Native com Expo (Router baseado em arquivos).
- **Linguagem:** TypeScript estrito.
- **Estilizacao:** Utilize o sistema de temas dinamicos nativo do template (suporte a Dark/Light mode).
- **Componentes:** Use preferencialmente os mais de 33 componentes customizados inclusos (Buttons, Cards, Inputs nativos do template) em vez de criar elementos do zero.

## 2. Boas Praticas de Codigo
- Envolva sempre textos dentro do componente `<Text>`.
- Evite operadores logicos que resultem em valores falsy renderizados incorretamente no JSX (Ex: evite `{condicao && <Componente />}` se houver risco de renderizar `0`, prefira ternarios).
- Exporte componentes como exports nomeados (ex: `export const MyComponent`), evite `export default`.
- Todas as strings visiveis para o usuario devem passar pelo sistema de internacionalizacao (i18n) configurado no projeto.

## 3. Criacao de Telas
- Siga a estrutura de pastas do Expo Router para criar rotas automaticas.
- Nomeie os arquivos de tela com o padrao `nome-da-tela.tsx` em snake_case.
- Cada tela deve ser um componente funcional exportado como named export.
- Utilize o hook `useRouter()` para navegacao programatica.
- Para rotas com parametros, crie arquivos como `[id].tsx` dentro da pasta correta.

## 4. Componentes
- Cada componente deve ter seu proprio arquivo na pasta `components/`.
- Use TypeScript interfaces para definir as props de cada componente.
- Prefira componentes puros (sem estado interno) quando possivel.
- Para componentes com estado, use `useState` e `useEffect` apenas quando necessario.
- Estilize com `StyleSheet.create()` para melhor performance.

## 5. Navegacao
- Configuracao de rotas deve ficar em `app/_layout.tsx` ou `app/(tabs)/_layout.tsx`.
- Use `Stack` para navegacao em profundidade e `Tabs` para navegacao principal.
- Navegue entre rotas usando `router.push()` ou `router.navigate()`.

## 6. Gerenciamento de Estado
- Para estado global, use Context API ou Zustand.
- Para dados locais, use `useState` ou `useReducer`.
- Para persistencia, use AsyncStorage ou MMKV.
- Nao misture estados de diferentes niveis de componente.

## 7. Estilizacao
- Cada componente pode ter seu proprio `StyleSheet` no final do arquivo.
- Use constantes de cor e tipografia do tema.
- Mantenha consistencia nos espacamentos e border-radius.
- Prefira `flex` para layouts responsivos.

## 8. Seguranca
- Nunca exponha chaves de API no codigo-fonte.
- Use variaveis de ambiente (.env) para dados sensiveis.
- Valide dados de entrada em forms e APIs.
- Implemente tratamento de erros em chamadas async.
