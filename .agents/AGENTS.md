# Regras de Design e UX - Divino Pão App

1. **UX Dinâmico e Prático para Operações**:
   - Telas usadas na operação diária (Cozinha, Produção, PDV) **devem evitar modais ou dialogs complexos**.
   - Privilegiar listas em linha, selects rápidos, carrosséis horizontais ou botões flutuantes para não quebrar a fluidez e ser prático no dia a dia.
   - Qualquer adição ou remoção (ex: itens da produção) deve ser feita na mesma tela (inline), com ações simples.

2. **Aderência Estrita ao Layout Premium**:
   - **Cores Oficiais**: Tiffany (`#44A09E` principal, `#57ADAD`), Terracotta (`#68492E` principal, `#C0532E`, `#E58A67`), Cream/Nude (`#FAF7F2`). Fundos primários em `bg-tiffany`, cards e bases em `bg-cream-light` ou Branco.
   - **Tipografia**: Destacar informações (metas, valores) com fontes `font-black` e `text-lg` ou superior. Uso pesado de caixas altas (`uppercase`) com espaçamento (`tracking-wider`) para etiquetas, sub-títulos e cabeçalhos.
   - **Arredondamento**: Sempre utilizar bordas acentuadas que transmitem sofisticação (`rounded-[32px]`, `rounded-3xl`, `rounded-[40px]` para grandes contêineres e headers de topo).
   - **Estilo de Botões Secundários/Remoção**: Ações de remover (cancelar) devem ter aspecto secundário ou apenas ícones elegantes com a cor de perigo apropriada, sem serem gigantescos, mas fáceis de tocar.
