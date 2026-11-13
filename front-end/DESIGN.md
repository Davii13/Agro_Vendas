---
name: AgroVendas
description: Livro-caixa do balcão de hortifruti no CEASA, legível a um braço de distância no celular.
colors:
  brand: "#26683f"
  brand-hover: "#1f5434"
  brand-tint: "#f0f6f1"
  rail: "#14331f"
  ground: "#f6f7f4"
  surface: "#ffffff"
  ink: "#171c15"
  ink-muted: "#4c5549"
  ink-subtle: "#5f695c"
  rule: "#dfe4dc"
  rule-strong: "#c9d0c5"
  success: "#1f5434"
  warning: "#a15c00"
  warning-tint: "#fff7e6"
  error: "#b3261e"
  error-tint: "#fdf2f1"
typography:
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.45
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    fontFeature: "tnum"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"
  button-destructive:
    backgroundColor: "{colors.error-tint}"
    textColor: "{colors.error}"
    rounded: "{rounded.md}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px"
  rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.surface}"
---

# Design System: AgroVendas

## Overview

**Creative North Star: "O Caderno de Balcão"**

AgroVendas é um livro-caixa, não um painel. O produto é a lista de vendas do dia: linhas separadas por filetes, dinheiro em algarismos tabulares, estado sempre escrito. O usuário principal é uma pessoa idosa, em pé no mercado, com o celular em uma mão e sol na tela; por isso a interface é clara, de contraste alto, com texto grande e áreas de toque generosas. Nada compete com os números.

A cor verde é a marca e trabalha como ferramenta: aparece na ação principal, no item de navegação ativo e no estado "pago". O resto é papel esverdeado, tinta quase preta e filetes finos. Profundidade vem de linhas e de espaço, nunca de sombra decorativa.

**Key Characteristics:**
- Planilha, não vitrine: linhas com filetes em vez de cartões empilhados.
- Dinheiro e contagens em algarismos tabulares, nunca em fonte monoespaçada larga.
- Estado = texto + ícone + cor. Cor sozinha nunca carrega significado.
- Alvos de toque de pelo menos 40 px; ação principal do celular fixa no rodapé.
- Raios pequenos (3 a 8 px) e nenhuma sombra em repouso.

## Colors

Estratégia restrita: neutros esverdeados mais um verde de ação. Semânticas (sucesso, aviso, erro) existem só para estado.

### Primary
- **Verde Safra** (#26683f): botões primários, item ativo, foco, estado "pago". Contraste com branco acima de 6:1.
- **Verde Safra Escuro** (#1f5434): hover do primário e texto de sucesso sobre branco.

### Secondary
- **Verde Galpão** (#14331f): a coluna de navegação, plana, sem gradiente. Segunda camada neutra, mais escura que o conteúdo.

### Neutral
- **Papel de Balcão** (#f6f7f4): fundo da página, levemente esverdeado.
- **Folha** (#ffffff): superfícies de dados (tabelas, listas, campos).
- **Tinta** (#171c15): texto principal e dinheiro. Nunca preto puro.
- **Tinta Suave** (#4c5549) e **Tinta Apagada** (#5f695c): texto secundário e rótulos, ambos acima de 4.5:1 sobre branco.
- **Filete** (#dfe4dc) e **Filete Forte** (#c9d0c5): linhas entre linhas e bordas de campos.

### Semantic
- **Ocre de Aviso** (#a15c00, fundo #fff7e6): pagamento parcial, pendências de atenção.
- **Tijolo de Erro** (#b3261e, fundo #fdf2f1): "devendo", vales em aberto, ações destrutivas.

### Named Rules
**The Verde Is A Tool Rule.** Verde marca ação, seleção e "pago". Não decora cabeçalhos nem fundos de seção.
**The Never Color Alone Rule.** Todo estado (Pago, Parcial, Devendo, Quitado, Pendente) leva palavra e ícone. A cor reforça, não informa.

## Typography

**Display / Body / Label Font:** Geist (com ui-sans-serif, system-ui). Uma família só, carregada com next/font.

**Character:** neutra e firme, com numerais tabulares limpos. Não há face de exibição: é uma ferramenta de trabalho.

### Hierarchy
- **Title** (600, 1.625rem a 2rem, 1.2): nome da seção no topo da página.
- **Headline** (600, 1.375rem, 1.3): título de bloco ("Planilha do dia") e nome do cliente nas linhas do celular.
- **Body** (400, 1.0625rem, 1.5): conteúdo, itens de lista, campos.
- **Label** (600, 0.9375rem, 1.45): rótulos de campo e cabeçalhos de tabela, em caixa normal.
- **Figure** (600, 1.375rem a 2rem, tnum): totais e contagens do resumo do dia.

### Named Rules
**The Tabular Figures Rule.** Dinheiro, quantidades e datas usam `tabular-nums`; as colunas alinham sem fonte mono.
**The Sentence Case Rule.** Rótulos em caixa normal. Sem caixa alta espaçada, sem sobretítulo acima de títulos.

## Layout

Casca em duas partes: coluna de navegação fixa de 18rem no desktop (gaveta no celular) e conteúdo com largura máxima de 80rem. Em telas abaixo de lg a barra superior é fixa e a ação principal da planilha vira uma barra inferior fixa de largura total, no alcance do polegar.

O ritmo é de 8 px: 16 px dentro de linhas, 24 px entre blocos, 40 px no topo do conteúdo no desktop. O resumo do dia é uma única faixa com filetes (total vendido em destaque, depois três números); a lista é uma tabela densa no desktop e linhas empilhadas com filetes no celular. Painéis largos (estoque, caixas) empilham em vez de ficarem lado a lado até a tela 2xl.

## Elevation & Depth

Plano por padrão. Superfícies são diferenciadas por filete e por contraste de fundo (papel x folha). A única sombra do sistema pertence a camadas flutuantes (diálogos, menus de seleção): `0 8px 24px -8px rgb(23 28 21 / 0.22)`.

### Named Rules
**The Flat At Rest Rule.** Nada tem sombra em repouso. Cartões e linhas não ganham elevação ao passar o mouse.

## Shapes

Raios pequenos e uniformes: 4 px em botões e campos, 6 a 8 px em tabelas e painéis. `rounded-full` só para pontos e indicadores minúsculos. Bordas de 1 px em Filete; 1 px em Filete Forte nos campos.

## Components

### Buttons
- **Shape:** retângulo de cantos suaves (4 px), altura 44 px (40 px em "sm"), texto 1.0625rem semibold.
- **Primary:** Verde Safra com texto branco; hover Verde Safra Escuro; ativo desce 1 px.
- **Outline:** fundo branco, borda Filete Forte; é o botão padrão para ações secundárias (Editar, Quitar, Devolver vales).
- **Destructive:** fundo Tijolo claro, texto Tijolo, borda suave. Nunca vermelho sólido.
- **Ghost / icon:** 44 px quadrados com `aria-label`, usados nas colunas de ação das tabelas.

### Cards / Containers
Quase não há cartões. Blocos de dados são uma moldura de 1 px em Filete com cantos de 6 px e fundo branco; dentro dela, linhas separadas por filetes. Nunca cartão dentro de cartão.

### Inputs / Fields
Altura 44 px (48 px no login), borda Filete Forte, fundo branco, texto 1.0625rem. Foco: borda e contorno de 2 px em Verde Safra. Erro: borda Tijolo via `aria-invalid`. Rótulo sempre acima.

### Navigation
Coluna Verde Galpão. Item com altura mínima de 48 px, texto 1.0625rem; o ativo tem fundo branco a 12% e peso semibold; sem faixa lateral. No celular abre como gaveta com sobreposição e botão "Menu" de 44 px.

### Summary strip
Faixa de métricas com filetes entre células: rótulo pequeno, número grande tabular. "Em aberto" fica vermelho só quando maior que zero.

### Payment and vale status
Texto + ícone: Pago (verde, check), Parcial com valor (ocre, menos), Devendo (vermelho, alerta). Entregas a produtores usam o mesmo vocabulário: valor pago de total, vales pagos de devidos, e "Quitado" ou "Pendente".

## Do's and Don'ts

### Do:
- **Do** manter o dinheiro em `tabular-nums` e alinhado à direita nas tabelas.
- **Do** escrever o estado por extenso com ícone (Pago, Parcial, Devendo, Quitado, Pendente).
- **Do** usar altura de 44 px para qualquer controle tocável e deixar a ação principal do celular na barra inferior.
- **Do** separar linhas com filetes de 1 px (#dfe4dc) em vez de empilhar cartões.
- **Do** manter o texto secundário em #4c5549 ou #5f695c; nunca mais claro que isso sobre branco.

### Don't:
- **Don't** usar gradiente, desfoque decorativo, sombra em repouso ou faixa colorida na lateral de um bloco.
- **Don't** colocar sobretítulo em caixa alta acima de um título.
- **Don't** repetir quatro cartões de "número grande, rótulo pequeno" como estrutura de página; use a faixa de resumo.
- **Don't** deixar a cor sozinha indicar dívida, atraso ou sucesso.
- **Don't** usar fonte monoespaçada para valores em reais.

## Not canonized

O relatório de histórico de cliente impresso (HTML em `printCustomerReport`, em `app/page.tsx`) ainda usa Arial e uma faixa lateral colorida. É um documento impresso fora da interface; permanece como defeito conhecido, não como regra do sistema. Os formulários continuam em diálogos modais herdados do projeto original; é um padrão a rever, não a replicar.
