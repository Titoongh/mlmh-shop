# Observabilité & infra multi-clients — notes de décision (2026-08-10)

Synthèse de la discussion logs/monitoring/infra. Objectif : une stack **centralisée,
self-hostée, économe** (~20–30 €/mois tout compris) couvrant logs + recherche + erreurs +
analytics + session replay pour **tous les clients** (des dizaines de sites/services), opérée
par une seule personne. À reprendre pour l'implémentation.

---

## 1. Les quatre briques (à ne pas confondre)

1. **Logs structurés** — la fondation : remplacer `console.log` par **pino** (JSON : timestamp,
   niveau, `requestId`, `sessionId`, nom d'événement). Sans ça, rien en aval n'est efficace.
2. **Agrégation / recherche de logs** — « montre-moi tous les logs de la session
   `cs_live_…` du 31/07 » : Loki, ELK/OpenSearch, ou ClickHouse (SigNoz/HyperDX).
3. **Error tracking** — exceptions front + back avec stack traces + alertes email
   (Sentry/GlitchTip). Le quick win n°1 : aurait attrapé le bug Clerk ET l'échec webhook.
4. **Product analytics** — funnels (panier → checkout → payé → téléchargé) + **session
   replay** (PostHog) : on aurait littéralement VU le clic mort sur « Create account ».

## 2. Verdicts sur les options écartées

- **Datadog** : excellent produit mais **ne se self-host pas** (SaaS pur) — éliminé par la
  contrainte. Prix (par host + par Go + par feature) pensé pour des budgets d'entreprise.
- **ELK/OpenSearch** : pire ratio pour un solo (JVM, gestion d'index, tuning permanent) pour
  du full-text dont on n'a pas besoin à cette échelle.
- **Sentry self-hosted** : multi-org natif mais ~30 conteneurs (Kafka, ClickHouse…), VM 16 Go
  dédiée. Trop lourd → GlitchTip (compatible SDK Sentry, migration possible plus tard sans
  toucher au code des sites, seuls les DSN changent).
- **PostHog self-hosted « production »** : abandonné de fait par PostHog (déploiement
  « hobby » mono-machine sans garanties). Viable UNIQUEMENT parce que notre volume est faible
  (dizaines de petits sites ≪ 100k events/mois). Si ça coince un jour : OpenReplay
  (self-hosted, replay seul) ou PostHog Cloud payant ciblé sur les sites marchands.
- **« Être proche de l'entreprise »** : le standard 2026 c'est **OpenTelemetry** comme couche
  d'instrumentation (+ Grafana LGTM ou ClickHouse derrière), pas ELK. Le savoir-faire
  transférable = OTel + LogQL/PromQL + Grafana. Alternative intégrée « Datadog-like »
  self-host : **SigNoz** (plus lourd que Loki, plus léger qu'ELK).

## 3. La stack retenue

| Besoin | Outil | Rôle |
|---|---|---|
| Logs structurés | **pino** dans chaque app | JSON + `requestId` + labels — la fondation |
| Collecte | **Vector** (1 agent par nœud Swarm, service `global`) | Lit les logs Docker de TOUS les conteneurs, ajoute `{client, app, env}` depuis les labels Docker (`com.docker.stack.namespace`), bufferise, expédie. Zéro changement dans les apps |
| Recherche | **Loki + Grafana** | ~1 Go RAM à notre échelle, stockage chunks sur S3 Scaleway, requêtes par labels + LogQL |
| Erreurs + alertes | **GlitchTip** | Un conteneur + Postgres, SDK Sentry (front+back), alertes email. Brique séparée de PostHog exprès : c'est d'elle que dépendent les alertes prod |
| Analytics + funnels + replay | **PostHog hobby** (self-hosted) | Un seul outil pour les trois ; embarque son ClickHouse (gourmand en RAM → VM à part) |

Qu'est-ce que Vector ? Un petit démon **par serveur** (pas dans les apps) : les apps loggent
sur stdout, Docker stocke en local sur chaque nœud → l'agent lit ces fichiers, enrichit,
bufferise (rien ne se perd si Loki est down), filtre le bruit (healthchecks), et pousse vers
Loki. Alternative équivalente : Grafana Alloy (successeur de Promtail). Choix : **Vector**
(config `sources → transforms → sinks` simple, agnostique du backend).

## 4. Infra

- **VM « observabilité »** 8 Go (Hetzner CPX31 ~14 €/mois ou équiv. Scaleway) :
  Grafana + Loki + GlitchTip.
- **VM « produit »** 8 Go : PostHog hobby seul (il se bat pour la RAM sinon).
- S3 Scaleway : chunks Loki + enregistrements replay (quelques €/mois).
- **Rétentions** : logs 30 j, replays 14–30 j, erreurs 90 j.
- Variante 1 seule VM 16 Go (~25 €/mois) possible mais blast radius partagé — préférer 2.

## 5. Rollout par app (répétable pour chaque client)

1. pino JSON + `requestId` + noms d'événements (une fois par app).
2. Rien côté logs : Vector est sur le nœud, les labels Docker font le tri.
3. DSN GlitchTip front + back (SDK Sentry npm, juste l'URL à changer).
4. Snippet PostHog sur les sites où funnels/replay ont du ROI (les shops d'abord).

**MLMH Shop = site pilote**, puis copier-coller pour les autres clients. Bonus : Grafana +
GlitchTip centralisés = accès logs/erreurs pour Claude (fin des fichiers de logs collés à la
main dans le chat).

## 6. Orchestration : Swarm vs Kubernetes

- **Kubernetes self-hosté : possible** (la voie réaliste = **k3s**, un binaire, ~512 Mo pour le
  control plane). Mais l'impôt opérationnel permanent (upgrades, ingress, CSI, RBAC, YAML,
  debugging profond) ne rapporte presque rien pour des dizaines de petits sites stateless +
  Postgres. À garder comme investissement de compétence, pas comme besoin.
- **Décision : garder Docker Swarm** avec un manager — simple, connu, CI/CD déjà branché,
  mode `global` parfait pour Vector. Points de vigilance :
  1. **Manager unique = SPOF** : backup automatisé et testé de `/var/lib/docker/swarm`
     (+ stacks en git) ; restauration = `swarm init --force-new-cluster`. Ou passer à
     3 managers si besoin de HA un jour.
  2. **Réseau** : ports Swarm (2377/7946/4789) jamais publics — firewall par IP, ou mieux un
     maillage **Tailscale/WireGuard** entre toutes les VMs et le Swarm par-dessus
     (obligatoire si multi-providers Hetzner + Scaleway).
  3. **Latence** : un swarm = une région autant que possible ; sinon deux petits swarms
     plutôt qu'un grand distendu.
  4. Workloads lourds (PostHog, Loki) sur des workers via `placement constraints`,
     manager gardé léger.

## 7. Prochaines étapes (quand on reprend)

1. Choisir le provider des 2 VMs (Hetzner vs Scaleway).
2. Plan de déploiement détaillé : stacks Swarm (compose) des 2 VMs, config Vector avec les
   labels multi-clients, rétentions, alerting email GlitchTip, layout Tailscale.
3. Pilote sur MLMH Shop : pino + DSN GlitchTip + snippet PostHog.
4. Généralisation aux autres clients.
