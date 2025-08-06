# Guia de Cores - Caixa Hub Waitlist

## Paleta de Cores Principal

### Tema Dark (Padrão)

#### Cores Base
- **Background**: `hsl(260, 25%, 3%)` - Roxo escuro quase preto
- **Foreground (Texto)**: `hsl(0, 0%, 98%)` - Branco suave

#### Cores de Componentes
- **Card Background**: `hsl(260, 25%, 7%)` - Roxo escuro
- **Card Text**: `hsl(0, 0%, 98%)` - Branco suave
- **Popover Background**: `hsl(260, 25%, 10%)` - Roxo escuro médio
- **Popover Text**: `hsl(0, 0%, 98%)` - Branco suave

#### Cores de Ação
- **Primary (Botões principais)**: `hsl(270, 70%, 65%)` - Roxo vibrante
- **Primary Text**: `hsl(0, 0%, 100%)` - Branco puro
- **Secondary (Botões secundários)**: `hsl(260, 20%, 14%)` - Roxo escuro suave
- **Secondary Text**: `hsl(0, 0%, 98%)` - Branco suave
- **Accent (Destaques)**: `hsl(330, 70%, 65%)` - Rosa/Magenta vibrante
- **Accent Text**: `hsl(0, 0%, 100%)` - Branco puro

#### Cores de Estado
- **Muted (Desabilitado)**: `hsl(260, 15%, 18%)` - Roxo acinzentado
- **Muted Text**: `hsl(260, 5%, 65%)` - Cinza claro
- **Destructive (Erro/Perigo)**: `hsl(0, 70%, 55%)` - Vermelho vibrante
- **Destructive Text**: `hsl(0, 0%, 100%)` - Branco puro

#### Cores de Interface
- **Border**: `hsl(260, 20%, 16%)` - Roxo escuro para bordas
- **Input Background**: `hsl(260, 20%, 16%)` - Roxo escuro para campos
- **Ring (Foco)**: `hsl(270, 70%, 65%)` - Roxo vibrante para indicador de foco

### Tema Light

#### Cores Base
- **Background**: `hsl(0, 0%, 98%)` - Branco suave
- **Foreground (Texto)**: `hsl(260, 20%, 10%)` - Roxo muito escuro

#### Cores de Componentes
- **Card Background**: `hsl(0, 0%, 100%)` - Branco puro
- **Card Text**: `hsl(260, 20%, 10%)` - Roxo muito escuro
- **Popover Background**: `hsl(0, 0%, 100%)` - Branco puro
- **Popover Text**: `hsl(260, 20%, 10%)` - Roxo muito escuro

#### Cores de Ação
- **Primary (Botões principais)**: `hsl(270, 70%, 50%)` - Roxo médio
- **Primary Text**: `hsl(0, 0%, 100%)` - Branco puro
- **Secondary (Botões secundários)**: `hsl(270, 30%, 95%)` - Roxo muito claro
- **Secondary Text**: `hsl(270, 50%, 30%)` - Roxo escuro
- **Accent (Destaques)**: `hsl(330, 60%, 50%)` - Rosa/Magenta médio
- **Accent Text**: `hsl(0, 0%, 100%)` - Branco puro

#### Cores de Estado
- **Muted (Desabilitado)**: `hsl(270, 20%, 96%)` - Roxo muito claro
- **Muted Text**: `hsl(260, 15%, 40%)` - Roxo acinzentado
- **Destructive (Erro/Perigo)**: `hsl(0, 70%, 50%)` - Vermelho médio
- **Destructive Text**: `hsl(0, 0%, 100%)` - Branco puro

#### Cores de Interface
- **Border**: `hsl(270, 20%, 90%)` - Roxo claro para bordas
- **Input Background**: `hsl(270, 20%, 90%)` - Roxo claro para campos
- **Ring (Foco)**: `hsl(270, 70%, 50%)` - Roxo médio para indicador de foco

## Efeitos Especiais

### Gradientes
- **Gradiente Principal**: Linear 135° de `Primary` para `Accent`
  - Dark: `hsl(270, 70%, 65%)` → `hsl(330, 70%, 65%)`
  - Light: `hsl(270, 70%, 50%)` → `hsl(330, 60%, 50%)`

### Efeitos de Brilho (Glow)
- **Primary Glow**: Sombra com 50% de opacidade da cor Primary
- **Accent Glow**: Sombra com 50% de opacidade da cor Accent

### Animações
- **Shimmer**: Efeito de brilho deslizante (2s loop infinito)
- **Gradient Shift**: Animação de gradiente (6s loop infinito)
- **Spinner**: Rotação 360° com borda Primary (1s loop infinito)

## Uso Recomendado

### Hierarquia Visual
1. **Primary**: CTAs principais, botões de ação importantes
2. **Secondary**: Ações secundárias, navegação
3. **Accent**: Destaques, notificações, elementos decorativos
4. **Muted**: Estados desabilitados, textos secundários
5. **Destructive**: Alertas, erros, ações perigosas

### Acessibilidade
- Todas as combinações de cores foram escolhidas para garantir contraste adequado
- Modo escuro como padrão para reduzir fadiga visual
- Suporte completo para preferência do sistema (light/dark)

### Notas para Implementação
- Usar variáveis CSS (custom properties) para fácil manutenção
- Border radius padrão: `0.5rem`
- Transições suaves entre temas
- Sombras adaptativas para modo escuro