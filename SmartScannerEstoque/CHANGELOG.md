# Changelog

## v2.3.0 (2026-07-13)

### Scanner - Layout Responsivo
- Reestruturacao completa do layout da tela Scanner
- Camera como camada de fundo com overlay separado
- Viewfinder e botao de captura centralizados entre topo e sessao
- Barra "SmartScanner" posicionada absolutamente no topo
- Sessao posicionada absolutamente acima da tab bar (`position: absolute, bottom`)
- Botao de captura (lupa) com posicionamento ajustavel via padding

### Scanner - Tela de Resultado
- Layout flex corrigido para evitar corte de conteudo
- Botoes "Cancelar" e "Adicionar" agora ficam visiveis acima da tab bar (`paddingBottom: 110`)
- ScrollView com `minHeight: 0` para flex shrink correto

### Input de Quantidade
- Corrigido bug impedia apagar e digitar novo valor no campo quantidade
- Antes: `parseInt(t) || 1` causava volta imediata para 1 ao apagar
- Agora: campo aceita valor vazio (0) enquanto o usuario digita
- Mesma correcao aplicada na tela de edicao de listas

### Sessao
- MaxHeight do painel aumentado de 280 para 340 para garantir visibilidade dos botoes
- Scroll de itens da sessao com `maxHeight: 140`
- Botões "Limpar" e "Salvar Lista" sempre visiveis quando ha itens

### Responsividade
- Todas as telas usam `useWindowDimensions` com breakpoint `isSmallScreen < 380`
- Padding inferior ajustado em todas as telas para nao ficar atras da tab bar absoluta:
  - Scanner: paddingBottom dinamico com insets
  - Listas: paddingBottom 120
  - Configuracoes: paddingBottom 100
  - Detalhe da Lista: paddingBottom 120

## v2.2.0

### Migracao OpenAI para Gemini
- Google Gemini API integrada via SDK `@google/genai`
- Autenticacao via header `x-goog-api-key` (nao query parameter)
- Suporte a multiplos modelos: gemini-3.5-flash, gemini-2.0-flash, gemini-1.5-flash
- Chaves de API salvas em SecureStore (nao mais em AsyncStorage)

### Tela de Configuracoes
- Selecao de provedor IA (Gemini/OpenAI)
- Modal separado para chave de API de cada provedor
- Selecao de modelo por provedor
- Chave Gemini aceita formatos AIza, AQ, sk-

### Parser de Resposta IA
- Tratamento de blocos markdown code na resposta JSON
- Tolerancia a erros de digitacao nos nomes dos campos (description/descricao/descripition)
- Extracao de JSON de dentro de texto livre

## v2.1.0

### Seguranca
- Chaves de API migradas de AsyncStorage para SecureStore
- Schema de validacao Zod com flexibilidade para formatos de chave
- Documentacao de seguranca no README

### Icones
- Substituicao completa de emojis por icones Lucide
- Icones consistentes em todas as telas

### Componentes
- AppButton, AppInput, AppModal, Card, EmptyState
- ToggleSwitch customizado para configuracoes

## v2.0.0

- Versao inicial com estrutura completa
- Scanner com CameraView
- Deteccao de duplicados automatica
- Exportacao CSV
- Salvar e gerenciar listas
- Tab bar com navegacao
