# Stripe — intégration & conventions

Cette doc adapte les **[stripe-recommendations de t3dotgg](https://github.com/t3dotgg/stripe-recommendations)**
à MLMH Shop. Lis d'abord la philosophie générale ci-dessous, puis **nos spécificités** (mode
logged-in vs mode guest legacy) qui divergent volontairement du guide d'origine.

> ⚠️ Le guide t3dotgg cible des **abonnements** (`subscriptions`). Nous vendons des
> **tablatures en paiement unique** (`mode: 'payment'`). La philosophie est identique, mais
> l'objet synchronisé n'est pas un abonnement : ce sont des **checkout sessions → `Purchase`**.

---

## 1. Le problème de fond (t3dotgg)

Stripe crée une architecture « split brain » : l'état du paiement vit dans Stripe pendant que
l'app maintient sa propre représentation en base. Avec 250+ types d'events, un ordre d'arrivée
non déterministe et des payloads webhook auxquels on ne peut pas se fier, on s'expose à des race
conditions et des états incohérents (« payé » côté app alors que Stripe a échoué, ou l'inverse).

## 2. La solution : une seule fonction de sync = source de vérité

Plutôt que de réagir event par event, on implémente **une fonction de synchronisation unique**
qui va chercher l'état frais directement chez Stripe et l'écrit en base. On l'appelle depuis
**tous** les points d'entrée (webhook + page de succès). On ne fait jamais confiance au contenu
du webhook : il sert uniquement de **déclencheur** ; la vérité vient du `GET` côté Stripe.

Chez nous cette fonction est :

```ts
// services/stripe-sync.ts
updateDatabaseWithLatestStripeData(customerId: string): Promise<void>
```

Elle liste les `checkout.sessions` du customer, lit les line items (les `tabId` sont stockés dans
les `metadata` du **product** Stripe), et upsert un `Purchase` + ses `PurchaseItem` par session.

## 3. Ordre des opérations (logged-in)

1. L'utilisateur clique « payer » → `POST /api/checkout-v2`.
2. **On crée toujours le customer Stripe AVANT le checkout** (`ensureCustomerBeforeCheckout`,
   `services/stripe-customer.ts`) et on stocke le mapping `userId ↔ stripeCustomerId` dans la
   table `StripeCustomer`. → On ne laisse JAMAIS quelqu'un checkout sans customer ID.
3. Création de la checkout session (`mode: 'payment'`), `success_url` → `/checkout/success`.
4. Après paiement, redirection vers `/checkout/success`.
5. La page succès appelle la sync **avant** d'afficher quoi que ce soit
   (`POST /api/checkout-v2/confirm-session`) → couvre la race condition où l'utilisateur arrive
   avant le webhook.
6. Le webhook (`/api/webhook/stripe`) appelle aussi la sync pour les events pertinents.

## 4. Webhook : events suivis

On ne traite que les events qui affectent l'état d'un achat
(`app/api/webhook/stripe/route.ts`, constante `ALLOWED_EVENTS`) :

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.updated`
- `customer.deleted`
- `charge.succeeded`
- `charge.failed`

Le handler : vérifie la signature → répond `200` immédiatement → traite en arrière-plan. Pour les
events avec customer ID, il appelle `updateDatabaseWithLatestStripeData`. Les erreurs de
traitement ne sont **pas** rethrow (pas de retry inutile : la sync est la source de vérité).

---

## 5. ⚠️ Nos spécificités vs le guide t3dotgg

### a) Paiement unique, pas abonnement
Pas de `stripe.subscriptions.list`. On synchronise des **checkout sessions** → `Purchase` /
`PurchaseItem`. Le mapping produit→tablature se fait via `product.metadata.tabId`.

### b) Deux modes coexistants : logged-in (cible) vs guest (legacy)

| | **Logged-in (Clerk)** | **Guest (legacy)** |
|---|---|---|
| Identité | user Clerk → `StripeCustomer` → `Purchase` | pas de customer ID |
| Customer Stripe | créé avant checkout (pattern t3gg) | aucun (`session.customer == null`) |
| Source de vérité | `updateDatabaseWithLatestStripeData(customerId)` | `checkout.session.completed` + email |
| Stockage | `Purchase` + `PurchaseItem` | `DownloadIntent` + `Download` |
| Accès fichiers | `/user/downloads` (auth) | lien email → `/checkout/download?session_id=…` |

Le webhook **laisse passer les events checkout sans customer ID** (guest) : il skip la sync Stripe
mais met quand même à jour le statut + envoie l'email de download (Brevo, templateId 1). Voir le
bloc « Guest checkout (no customer ID) » dans le handler.

> Le mode guest est **legacy** : la cible long terme est tout le monde en logged-in (pattern
> t3gg propre). Ne pas étendre le guest mode ; le maintenir uniquement pour la compat.

### c) Divergences de nommage
- t3gg parle de KV store → chez nous c'est **Postgres via Prisma** (`StripeCustomer`,
  `Purchase`). `services/stripe-kv.ts` ne fait PLUS de KV : c'est un helper de lecture des achats
  en base (nom historique conservé).
- `syncStripeDataToKV` (guide) ≡ `updateDatabaseWithLatestStripeData` (nous).

---

## 6. Gotchas / rappels

- **Désactiver Cash App Pay** dans le dashboard Stripe (taux de fraude élevé d'après t3gg).
- Appeler la sync sur `/checkout/success` **avant** d'afficher la page (race condition webhook).
- Ne pas se fier au payload webhook : toujours re-fetch côté Stripe pour les users logged-in.
- Le webhook répond `200` tout de suite et traite en tâche de fond via une promesse
  fire-and-forget → attention en serverless (préférer `waitUntil` si on migre sur une plateforme
  qui kill le process après la réponse).
- Garder `apiVersion` Stripe alignée entre tous les fichiers (`services/*`, webhook).

## 7. Fichiers clés

| Fichier | Rôle |
|---|---|
| `services/stripe-sync.ts` | fonction de sync (source de vérité) |
| `services/stripe-customer.ts` | get/create customer avant checkout |
| `services/stripe-kv.ts` | lecture des achats en base (nom legacy) |
| `services/purchase-verification.ts` | vérification d'accès aux fichiers |
| `app/api/checkout-v2/route.ts` | création de la checkout session |
| `app/api/checkout-v2/confirm-session/route.ts` | sync eager depuis `/checkout/success` |
| `app/api/webhook/stripe/route.ts` | webhook (sync pattern ; gère logged-in + guest) |

Voir aussi `STRIPE_V2_DEPLOYMENT_GUIDE.md` (racine repo) pour le déploiement.
