# Porsche Sales Intelligence — Design Direction

## Abordagens Estilísticas

### 1. Void Editorial
Dark cinematic com photography full-bleed, tipografia uppercase com wide tracking, zero-radius geometry. Inspirado no DESIGN.md (estilo Ferrari/Porsche editorial). Canvas preto absoluto com accent vermelho apenas para interações. Superfícies flat sem elevation.

### 2. Glass Luxury
Dark com glassmorphism sutil, cards translúcidos com blur, gradientes de roxo/dourado. Mais decorativo e "premium tech".

### 3. Swiss Minimal
Neutro com muito whitespace, tipografia Helvetica, grid rígido, dados como protagonistas absolutos. Monocromático.

## Abordagem Escolhida: Void Editorial

**Design Movement:** Dark cinematic editorial — inspirado no site oficial da Porsche Brasil e no DESIGN.md fornecido.

**Core Principles:**
1. Photography IS the layout — imagens full-bleed definem seções
2. Zero elevation — surfaces flat, depth through tonal layering only
3. Whispered typography — uppercase, wide tracking, small sizes, never shouts
4. Single accent — vermelho Porsche (#da291c) apenas para hover/active states

**Color Philosophy:**
- Void Black (#000000): Hero panels, cinematic backgrounds
- Night Surface (#181818): Cards, secondary surfaces
- Graphite (#303030): Hairline dividers, borders
- Canvas White (#ffffff): Primary text
- Fumo (#8f8f8f): Muted body text, captions
- Rosso Corsa (#da291c): Interactive hover/focus ONLY

**Layout Paradigm:** Full-bleed vertical scroll, single-column centered, sections alternate between full-viewport photography and dark void with minimal copy. Cards flat, 0px radius.

**Signature Elements:**
1. Full-bleed hero with Porsche photography
2. Hairline 1px dividers (#303030)
3. Uppercase tracked labels as section markers

**Interaction Philosophy:** Minimal chrome, color shifts signal interactivity, no button fills. Hover = color shift to #da291c.

**Typography System:**
- Display: Uppercase, wide tracking (0.083em-0.091em), 11-12px
- Headlines: 16px, weight 500, tight tracking (0.005em)
- Body: 13px, weight 400
- Tracking inversely proportional to size

**Brand Essence:** Porsche Sales Intelligence — Executive dashboard for luxury automotive data. Refined, restrained, cinematic.

**Personality:** Prestigious · Cinematic · Restrained

**Brand Voice:** Confident brevity. Labels over paragraphs. Data speaks through whitespace.

**Signature Brand Color:** Rosso Corsa #da291c — only for interactive moments

## Style Decisions
- Adapt Ferrari DESIGN.md tokens for Porsche context (same dark cinematic language)
- Use provided Porsche logo and photography
- ECharts for data visualization (matching design system)
- Glassmorphism sutil nos cards conforme briefing
- Red Porsche accent for highlights (briefing override)
