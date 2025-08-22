/*** PROMPT PER GITHUB COPILOT – GENERA UN FILE CSS MODERNO E MOBILE-FIRST ***

Obiettivo 👉  Definire uno stylesheet completo per un set di componenti React
   (Card, Navbar, Button, Modal, Form, Tooltip) che sia:
   • Moderno, pulito, leggero
   • Mobile-first con breakpoint responsivi (≥576 px, ≥768 px, ≥992 px, ≥1200 px)
   • Animato in modo discreto (hover, focus, apertura modale, tooltip)
   • Icon-ready (usa classi “.icon--*”… nessuna emoji)
   • Accessibile (contrasto colori AAA per testi primari, ARIA-friendly focus-ring)
   • Facile da themare (usa CSS custom properties = variabili)
   • Autocontenuto (no Tailwind / Bootstrap; sì flexbox + grid nativi)
   • Pronto per CSS Modules o styled-components (nomi in formato kebab-case)

Linee guida dettagliate 👇
1. Palette e tipografia
   – Definisci :root { --color-primary, --color-secondary, --color-accent, --color-bg, --color-text/*. }  
   – Font-stack moderno (p.es. `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`).  
   – Size-scale con clamp() per testi (es. clamp(1rem, 0.9rem + 0.5vw, 1.25rem)).  

2. Layout
   – Usa display:grid per layout principali e flexbox per elementi inline.  
   – Imposta container max-width e padding variabili con media query.  
   – Safe-area insets per notch devices: `padding-inline: env(safe-area-inset-left) env(safe-area-inset-right);`.

3. Componenti
   • .card
       – Rounded corners 0.75rem, shadow con transition 150 ms ease-in-out.  
   • .navbar
       – Sticky top, backdrop-filter: blur(12px), menu hamburger trasformato via CSS.  
   • .button
       – Variant (primary, secondary, ghost); animazione scale(0.96) su active.  
   • .modal
       – Fade + translateY(16px) su apertura, overscroll-contain, focus-trap styles.  
   • .form-field / .input
       – Focus-ring 2px solid var(--color-accent), floating-label optional.  
   • .tooltip
       – Opacity/translateY transition con delay 60 ms, arrow via ::after.  

4. Motion
   – Prefer transforms/opacity per performance.  
   – Mantieni durate 120-250 ms; riduci a 0 per `@media (prefers-reduced-motion: reduce)`.  

5. Iconi
   – Inserirai icon font o React Icons; riserva spazi con `.icon--sm`, `.icon--md` ecc. niente emoji.

6. Naming e struttura
   – BEM-like su base component: `.button--primary`, `.modal__header`, ecc.  
   – Commenta sezioni principali con `/* -------- Section -------- */`.  

7. Extras
   – Include un reset/light normalize; box-sizing: border-box globale.  
   – Dark mode ready: `@media (prefers-color-scheme: dark) { … }`.  
   – Documenta ovunque utile con commenti concisi (<80 caratteri per linea).

**Output atteso** ➜ Un singolo file CSS pronto da importare, ordinato, con commenti e variabili AL TOP.

*** FINE PROMPT ***/
