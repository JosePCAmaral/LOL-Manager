# Simulação de partida e algoritmo de draft — LoL Manager (nome provisório)

> Documento técnico complementar ao `arquitetura_lol_manager.md`. Define os pesos e fórmulas usados pelo motor de simulação. 🔶 marca parâmetros que servem como ponto de partida e devem ser recalibrados depois de playtesting.

## 1. Fórmula base: atributo efetivo

Antes de entrar em qualquer fase, todo atributo relevante de um jogador passa por modificadores que capturam maestria de campeão, estado físico/mental e variância:

```
EfetivoX = AtributoBaseX × ModMaestria × ModForma × ModStamina × ModEscala × (1 + Variancia)
```

| Modificador | Fórmula | Faixa |
|---|---|---|
| `ModMaestria` | `0.8 + (maestria-1)/19 × 0.3` | 0.8 (maestria 1) a 1.1 (maestria 20) |
| `ModForma` (moral 0-100) | `0.85 + (moral/100) × 0.3` | 0.85 a 1.15 |
| `ModStamina` (stamina 0-100) | `0.7 + (stamina/100) × 0.3` | 0.7 a 1.0 |
| `Variancia` | sorteio com seed entre `±VarMax`, onde `VarMax = 0.30 - (consistência/20) × 0.20` | ±10% (consistência 20) a ±29% (consistência 1) |
| `ModEscala` | ver seção 2 | 0.85 a 1.20 |

## 2. Traços de matchup e escala do campeão

Cada campeão (entidade `Champion`, ver `arquitetura_lol_manager.md`) carrega traços que afetam o resultado independentemente da habilidade do jogador:

| Traço | Escala | Captura |
|---|---|---|
| Alcance | 0-2 | Vantagem de troca à distância |
| Poder no early | 0-2 | Força nas primeiras trocas de rota |
| Sustentação | 0-2 | Regeneração/cura própria na rota |
| Mobilidade | 0-2 | Capacidade de fugir/forçar troca |
| Curva de escala | `early` / `mid` / `late` | Em qual fase do jogo o campeão é mais forte |

**Modificador de matchup (counter), aplicado só na fase de Laning:**

```
ModMatchup = 0.5×(Alcance_A - Alcance_B) + 0.7×(PoderEarly_A - PoderEarly_B)
           + 0.4×(Sustentacao_A - Sustentacao_B) + 0.3×(Mobilidade_A - Mobilidade_B)
```

Resultado limitado entre -3 e +3, somado direto ao `LaneScore` da rota — dois jogadores de nível idêntico podem ter uma rota desequilibrada se os campeões counterarem entre si.

**Modificador de escala (`ModEscala`), aplicado nas três fases:**

| Curva do campeão | Fase de Laning | Fase de Macro | Fase de Teamfight |
|---|---|---|---|
| Early | ×1.15 | ×1.00 | ×0.85 |
| Mid | ×0.95 | ×1.05 | ×1.00 |
| Late | ×0.85 | ×0.95 | ×1.20 |

Cada fase usa o checkpoint correspondente (Laning = early, Macro = mid, Teamfight = late), então o motor não precisa saber a duração final da partida pra aplicar o modificador certo em cada momento.

## 3. Fase 1 — Laning (peso 30% do resultado final)

| Papel | Atributos usados | Fórmula | Peso na fase |
|---|---|---|---|
| Topo | Mecânica, Laning | `Mecânica×0.4 + Laning×0.6` | 20% |
| Meio | Mecânica, Laning | `Mecânica×0.4 + Laning×0.6` | 25% |
| Atirador | Mecânica, Laning | `Mecânica×0.4 + Laning×0.6` | 20% |
| Suporte | Mecânica, Laning | `Mecânica×0.3 + Laning×0.7` | 15% |
| Caçador | Mecânica, Game sense | `Mecânica×0.5 + GameSense×0.5` | 20% |

```
LaneScore_papel = (ScoreBaseDoJogador × ModEscala) + ModMatchup
LaningScore_time = Σ (LaneScore_papel × peso do papel)
```

A diferença entre os dois times nessa fase determina quem chega no mid game com vantagem de ouro/XP.

## 4. Fase 2 — Macro/mid game (peso 35%)

| Papel | Atributos | Fórmula | Peso na fase |
|---|---|---|---|
| Caçador | Game sense, Shotcalling | `GameSense×0.6 + Shotcalling×0.4` | 30% |
| Suporte | Game sense, Shotcalling | `GameSense×0.7 + Shotcalling×0.3` | 25% |
| Meio | Game sense, Shotcalling | `GameSense×0.6 + Shotcalling×0.4` | 20% |
| Topo | Game sense | `GameSense` | 15% |
| Atirador | Game sense | `GameSense` | 10% |

🔶 O IGL é definido automaticamente como o titular com maior Shotcalling entre os 5; seu valor aplica um bônus multiplicativo sobre o `MacroScore` do time inteiro:

```
BonusIGL = 1 + (Shotcalling do IGL / 20) × 0.15
MacroScore_time = Σ (score do papel × peso do papel × ModEscala) × BonusIGL
```

## 5. Fase 3 — Teamfight/late game (peso 35%)

| Papel | Atributos | Fórmula | Peso na fase |
|---|---|---|---|
| Atirador | Teamfight, Mecânica | `Teamfight×0.6 + Mecânica×0.4` | 25% |
| Caçador | Teamfight, Mecânica | `Teamfight×0.5 + Mecânica×0.5` | 20% |
| Meio | Teamfight, Mecânica | `Teamfight×0.5 + Mecânica×0.5` | 20% |
| Suporte | Teamfight, Mecânica | `Teamfight×0.6 + Mecânica×0.4` | 20% |
| Topo | Teamfight, Mecânica | `Teamfight×0.5 + Mecânica×0.5` | 15% |

Sinergia entre os 5 titulares (relação que cresce com scrim/tempo de jogo junto) entra como multiplicador final:

```
ModSinergia = 1 + (SinergiaMédia/100) × 0.10
TeamfightScore_time = Σ (score do papel × peso do papel × ModEscala) × ModSinergia
```

## 6. Combinando tudo em probabilidade de vitória

```
VantagemTotal = 0.30×(Laning_A - Laning_B) + 0.35×(Macro_A - Macro_B) + 0.35×(Teamfight_A - Teamfight_B)
ProbVitoria_A = 1 / (1 + e^(-0.35 × VantagemTotal))
```

🔶 O fator `0.35` na exponencial controla quão decisiva é uma vantagem de atributo — provavelmente o primeiro número a recalibrar depois de simular um volume razoável de partidas. Um sorteio com seed decide o vencedor contra essa probabilidade.

## 7. Geração da timeline de eventos

Com o vencedor e os três scores de fase definidos, a timeline é gerada por simulação de "ticks" (a cada minuto simulado):
- Early game prioriza eventos de rota (primeiro abate, primeira torre), ponderados pelo `LaningScore`.
- Mid/late game pondera abates e objetivos pelo `MacroScore`/`TeamfightScore`.
- A duração da partida varia inversamente à diferença entre os times: jogos equilibrados tendem a durar mais (30-40 min simulados), atropelos terminam mais rápido (18-25 min).

## 8. Algoritmo de sugestão de draft

Fluxo por partida:
1. **Bans** — feitos manualmente pelo jogador (manager).
2. **Picks** — pra cada papel, a IA avalia os campeões no pool de maestria do jogador daquele papel (excluindo banidos/já escolhidos) e calcula:

```
Score = 0.6 × MaestriaNormalizada + 0.4 × ContribuicaoComp
MaestriaNormalizada = maestria / 20
```

`ContribuicaoComp` mede o quanto as tags do campeão (`engage`, `peel`, `waveClear`, `ccChain`) preenchem uma lacuna que a composição parcial do time ainda não tem — o 1º campeão de engajamento pesado rende muito mais que o 3º.

3. A IA apresenta os 3 candidatos com maior `Score` pra escolha do jogador. Se o jogador forçar um campeão fora do pool de maestria, ele entra normalmente no draft — o risco já é capturado pelo `ModMaestria` baixo na hora de simular.

## 9. Parâmetros sinalizados para ajuste

- Peso `0.35` na função logística de probabilidade de vitória (seção 6).
- Pesos por papel dentro de cada fase (seções 3, 4 e 5) — baseados em como essas posições costumam influenciar o jogo real, primeira coisa a recalibrar com playtesting.
- Pesos do `ModMatchup` (0.5 / 0.7 / 0.4 / 0.3) — definem quanto um counter de campeão pesa frente à habilidade do jogador.
- Bônus máximo do IGL (+15%) e da sinergia de equipe (+10%).
