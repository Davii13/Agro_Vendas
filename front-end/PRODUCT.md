# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: an older man (the owner's father) who runs a hortifruti stall at CEASA and uses the app mostly on his phone, standing in the market, between customers. He enters sales and checks what he owes producers; he is not a power user of software. A second login exists for the owner/developer. (Confirmed in interview; staff accounts are not confirmed.)

## Product Purpose

AgroVendas records the day of a hortifruti trader: sales of boxes to customers (with plastic-box "vale" tracking), deliveries received from rural producers, a customer register, a product (mercadoria) register, and a daily stock comparison. Success is that the daily sales sheet is quick to fill and trustworthy to read, and that nothing owed to a producer (cash or plastic-box vales) is forgotten.

## Positioning

A single-trader ledger built around the CEASA workflow: the 6424 plastic box and its vale are first-class, and a delivery carries both a cash balance and a vale balance owed to the producer. Generic POS or inventory software does not model that.

## Operating Context

Phone-first, one hand, in a noisy market, often outdoors in daylight. Data entry happens in short bursts all day. Currency is BRL, locale pt-BR, dates dd/mm/aaaa. Desktop is secondary.

## Capabilities and Constraints

- Sections: Planilha de Vendas (primary), Gestão de Entregas (producers, deliveries, payment control), Mercadorias (CRUD), Clientes, Estoque & Comparativo, Controle de Caixas 6424.
- Product names are chosen from a registered list, never free text.
- Customer has a `localizacao` field (not e-mail).
- Auth is JWT login; the front is Next.js 16 / React 19 / Tailwind 4 with shadcn-style Radix components and lucide-react icons. No new dependencies unless unavoidable.
- All business rules, APIs and auth are out of scope for the redesign.

## Brand Commitments

Name "AgroVendas" and the color green are binding. Everything else (type, palette structure, logo treatment) is open. The current logo may be reused (front-end/public/logo.png).

## Evidence on Hand

No customer testimonials, metrics or marketing content exist; none may be invented. Real data lives in the user's database; demo data is not needed for this redesign.

## Product Principles

1. Fast entry beats everything: the common sale is a few taps.
2. Money and debts are never ambiguous: paid, partial and owed are distinguishable at a glance, without relying on color alone.
3. Built for an older phone user: large type, high contrast, generous tap targets, plain Portuguese.
4. Quiet interface: the data is the visual content, chrome stays out of the way.

## Accessibility & Inclusion

Older primary user on a phone in daylight: body text at least 16px, key figures larger, tap targets at least 44px, contrast at WCAG AA or better (AAA for primary text and money), state never conveyed by color alone, visible focus, respects reduced motion.
