# Documento de Design — LoL Manager (nome provisório)

> Versão 1 — documento base de planejamento. Itens marcados com 🔶 são hipóteses de design que ainda podem mudar na revisão.

## 1. Visão geral

**Conceito:** simulador de gestão de organização de esports de League of Legends. O jogador assume o papel de gerente/diretor de um clube, cuidando de elenco, contratações, finanças, scouting e treino, e acompanha o desempenho do time em partidas simuladas ao longo de splits e competições internacionais.

**Gênero:** estratégia/simulação de gestão esportiva.

**Plataforma:** web, com arquitetura pensada para funcionar como PWA desde o início e abrir caminho para mobile no futuro.

**Equipe:** desenvolvimento solo.

**Objetivo do projeto:** portfólio e aprendizado.

**Inspirações:**
- World Soccer Champs — estrutura de gestão de elenco, transferências, competições e o conceito de data-pack para conteúdo licenciado opcional.
- Ecossistema competitivo real de League of Legends — estrutura de ligas, sistema de Tier 1/Tier 2, calendário internacional, dinâmica de draft.

**Identidade do conteúdo:** ligas, times e jogadores fictícios por padrão, com um sistema de **data-pack** opcional que permite carregar nomes/escudos de times reais e nomes/overs de jogadores reais por fora do jogo base. Isso evita depender de licenciamento para o jogo funcionar e dá liberdade pra quem quiser uma experiência mais realista.

## 2. Escopo do MVP

**Dentro do escopo v1:**
- 6 ligas de Tier 1 fictícias, inspiradas na estrutura real (equivalentes a LCK, LPL, LEC, LCS, CBLOL, LCP).
- Calendário internacional fictício equivalente a torneio de abertura de temporada, torneio de meio de temporada e mundial de fim de ano.
- Gestão de elenco, staff, contratos e finanças.
- Sistema de draft (pick/ban) misto: bans manuais, picks sugeridos por IA.
- Simulação de partida em modo espectador, com visualização no minimapa.
- Calendário dia a dia com jogos oficiais, scrims, treino geral, treino de campeão, descanso e férias/entressafra.
- Sistema de scouting de jogadores de SoloQ da região.
- Sistema de data-pack para conteúdo real opcional.

**Fora do escopo v1 (planejado para depois):**
- Ligas de Tier 2 e sistema de promoção/relegação (regras variam bastante por região no mundo real e exigem o core já validado antes de entrar).
- Estrutura de time acadêmico/sub completo.
- Interferência táctica do jogador durante a partida simulada.
- Sistema de patches/meta dinâmico afetando força de campeões (🔶 pode ser introduzido como evolução do sistema de draft).

## 3. Estrutura competitiva

### 3.1 Ligas de Tier 1
Seis ligas fictícias, uma por região, espelhando a divisão real do cenário competitivo de LoL (Américas, EMEA, Coreia, China, Ásia-Pacífico — sendo Américas dividida em duas ligas distintas). Cada liga roda em formato de split, com fase de pontos corridos seguida de playoffs.

### 3.2 Calendário internacional
Três eventos cruzando regiões, fictícios mas equivalentes em função aos eventos reais:
- Torneio de abertura de temporada (early season).
- Torneio de meio de temporada — vagas distribuídas por desempenho na liga regional.
- Mundial — evento final da temporada, reúne as melhores equipes de todas as regiões.

### 3.3 Sistema de data-pack 🔶
Estrutura técnica a definir na arquitetura, mas conceitualmente: um pacote de dados externo e opcional que sobrescreve nomes/escudos de times e nomes/atributos de jogadores reais por cima da base fictícia, sem alterar a lógica do jogo.

## 4. Elenco e staff

**Estrutura do elenco (v1):**
- 5 titulares, um por posição: Topo, Caçador (Jungle), Meio, Atirador (ADC/Bot), Suporte.
- Até 1 reserva por posição.

**Staff:**
- Coach — eleva eficiência geral de treino.
- Analista — melhora qualidade das sugestões de draft e relatórios pós-jogo.
- Psicólogo — gerencia moral, resiliência mental e risco de burnout.
- Olheiro (scout) — opera a rede de scouting de SoloQ.

**Scouting:** sistema que acompanha jogadores de SoloQ da região (ladder ranqueada), permitindo observar desenvolvimento ao longo do tempo antes de contratar. Quanto mais investida a rede de scouting, mais precisos os relatórios de potencial de jogadores ainda não revelados.

## 5. Atributos dos jogadores

Escala de 1 a 20 por atributo.

| Atributo | Categoria | O que representa | Mais relevante para |
|---|---|---|---|
| Mecânica | Técnico | Execução de combos, CS, esquiva de skillshots | Todos, especialmente ADC/Mid |
| Laning | Técnico | Desempenho na fase de rota (trade, controle de rio) | Topo/ADC/Mid |
| Pool de campeões | Técnico | Maestria por campeão específico | Todos — alimenta a IA de draft |
| Teamfight | Técnico | Posicionamento e prioridade de alvo em lutas 5v5 | Todos, especialmente ADC/Suporte |
| Game sense/macro | Estratégico | Leitura de mapa, timing de objetivo, visão | Caçador/Suporte principalmente |
| Shotcalling/liderança | Estratégico | Qualidade de decisão quando exerce IGL | Caçador/Meio (quem assume IGL) |
| Adaptação à meta | Estratégico | Velocidade de realinhar o pool ao patch atual | Todos |
| Consistência | Estratégico | Reduz a variância entre uma partida e outra | Todos |
| Sinergia | Social | Relação par-a-par, cresce com tempo jogado junto | Por dupla/elenco, não é fixo no jogador |
| Resiliência mental (clutch) | Social | Desempenho sob pressão em momentos decisivos | Todos |
| Moral/forma | Social | Modificador temporário de curto prazo | Todos |
| Potencial | Desenvolvimento | Teto de evolução possível em treino | Jovens/scoutados |
| Idade/experiência | Desenvolvimento | Evolução rápida x estabilidade/consistência | Todos |

**Como influenciam a simulação:**
- Draft: pool de campeões + adaptação à meta geram as sugestões da IA.
- Fase de rota: mecânica + laning definem diferencial de ouro/XP early game.
- Macro game: game sense + bônus de shotcalling do IGL definem corridas de objetivo.
- Teamfight: teamfight + mecânica + sinergia com quem está ao lado decidem o resultado da luta.
- Consistência controla a variância de toda essa rolagem; moral/forma multiplica o resultado pra cima ou pra baixo no curto prazo.

## 6. Sistema de draft (pick/ban)

Fluxo misto por partida:
1. Bans — feitos manualmente pelo jogador (manager).
2. Picks — sugeridos pela IA, priorizando campeões de alta maestria no pool do jogador da posição e o quanto cada escolha contribui pra força da composição (sinergia entre os 5 campeões escolhidos).
3. O jogador escolhe entre as sugestões (ou força uma escolha fora da lista, com possível penalidade de execução se for fora do pool de maestria do jogador).

🔶 Sistema de patches/meta dinâmico (força relativa de campeões mudando com o tempo) é um candidato a feature pós-MVP que se conecta diretamente com "adaptação à meta".

## 7. Simulação de partida

Modo espectador — o jogador observa, sem interferir taticamente durante a partida.

**Visualização:** minimapa com os 10 jogadores representados por indicadores que se movem entre rotas, jungle e objetivos, refletindo decisões de macro geradas pela simulação.

**Eventos anunciados:** abates, conquista de torres, ouro de equipe, itens importantes comprados, objetivos neutros (dragão/equivalente, baron/equivalente).

**Fases simuladas:**
- Fase de rota — early game, baseada em laning + mecânica + matchup de campeões.
- Transição/mid game — rotações e disputa de objetivos, baseada em game sense + shotcalling.
- Teamfights — baseada em teamfight + mecânica + sinergia.

## 8. Calendário e progressão de tempo

Progressão dia a dia (não semanal), porque o ritmo real de LoL mistura dias de jogo oficial com dias de treino/scrim ao longo da semana.

| Tipo de dia | Quando ocorre | Efeito |
|---|---|---|
| Jogo oficial | Fixado pelo calendário da liga | Resultado conta pra classificação do split |
| Scrim | Livre, em qualquer dia sem jogo oficial | Ganha sinergia entre titulares + leve evolução de consistência |
| Treino geral | Livre | Evolui atributos gerais, ritmo conforme potencial do jogador |
| Treino de campeão | Livre | Jogador escolhe um campeão específico por atleta para focar; aumenta a maestria daquele campeão no pool dele |
| Descanso | Livre | Recupera stamina e estabiliza moral |
| Evento especial | Livre/sazonal | Dia de mídia (sobe fama/fanbase) ou bootcamp (intensifica treino antes de evento internacional) |
| Férias/entressafra | Período fixo entre splits | Sem jogos; stamina recupera totalmente; janela de transferências e renovação de contratos fica aberta |

**Stamina:** recurso por jogador que se consome em jogos/scrims/treinos e recupera em dias de descanso ou férias. Stamina baixa reduz temporariamente os atributos efetivos do jogador naquele dia; acúmulo de fadiga sem descanso aumenta risco de burnout (queda de desempenho ou afastamento temporário), gerenciado pelo psicólogo do staff.

## 9. Finanças e patrocínios

**Receitas:**
- Patrocínio fixo — valor garantido por contrato (camisa, naming rights).
- Patrocínio variável — bônus por desempenho (ex: playoffs, vaga internacional).
- Premiação de liga — valor por colocação final do split + bônus de playoffs/internacional.
- Receita de conteúdo/fanbase — renda passiva que escala com o tamanho da base de fãs do clube.

**Despesas:**
- Salários dos jogadores — definidos em contrato (duração, valor, multa de rescisão), escalam com rating atual e potencial.
- Salários do staff — coach, analista, psicólogo, olheiro.
- Operacional — manutenção de instalações, viagens, equipamento.
- Scouting — custo recorrente da rede de observação de SoloQ; rede mais cara gera relatórios mais precisos.

**Loop financeiro:** desempenho gera fama → fama atrai patrocínio/receita de conteúdo → orçamento maior → contratações e staff melhores → desempenho melhora de novo. Reputação do clube funciona como multiplicador central desse ciclo.

## 10. Mercado de transferências

- Janela principal durante o período de férias/entressafra entre splits.
- Contratações vêm de agência livre, negociação direta com outro clube, ou indicação do sistema de scouting de SoloQ.
- Contratos têm duração, salário e cláusula de multa rescisória.

## 11. Roadmap de desenvolvimento sugerido (dev solo)

1. **Fundação** — modelos de dados (jogadores, clubes, ligas Tier 1 fictícias), calendário básico, estrutura do split.
2. **Gestão core** — elenco, contratos, finanças básicas, staff.
3. **Draft + resultado simulado simples** — sem visualização gráfica ainda, só cálculo de resultado.
4. **Simulação visual no mapa** — maior risco técnico do projeto; implementar depois que o core de gestão já estiver validado.
5. **Treino e scouting** — treino geral, treino de campeão, rede de scouting de SoloQ.
6. **Sistema de data-pack** — overlay de conteúdo real opcional.
7. **Pós-MVP** — Tier 2, promoção/relegação, sistema de patches/meta dinâmico, estrutura acadêmica completa.

## 12. Riscos e questões abertas

- 🔶 Nome definitivo do jogo e identidade visual ainda não definidos.
- A simulação visual no minimapa é o sistema de maior complexidade técnica do projeto — vale prototipar isolado antes de integrar ao resto.
- Balanceamento dos pesos de atributos na fórmula de simulação vai exigir iteração e ajuste fino depois de uma primeira versão jogável.
- Regras de promoção/relegação entre Tier 1 e Tier 2 variam bastante por região no mundo real; quando esse sistema entrar em escopo, será preciso decidir um modelo único simplificado ou replicar as variações.

## 13. Próximos passos

Com este documento validado, a próxima etapa é a estruturação de módulos e entidades do jogo (modelagem de dados, separação de domínios e arquitetura técnica), para then seguir com a implementação.
