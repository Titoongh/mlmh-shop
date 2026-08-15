# Plan SEO — MLMH Shop

> Suivi de la campagne d'indexation démarrée le 2026-08-10. Ce document est la source de
> vérité : état des lieux, correctifs livrés, actions Search Console datées, calendrier de
> vérification. Le mettre à jour à chaque action ou constat (avec la date).

Propriété Search Console : `sc-domain:michel-lelong-guitar-tab-workshop.com` (propriété de
domaine, tous sous-domaines inclus). Accès : session Chrome de Martin via Claude in Chrome
(pas encore d'accès API, voir "Outillage" plus bas).

## Diagnostic initial (2026-08-10)

125 pages non indexées / 119 indexées, 8 motifs :

| Motif | Pages | Analyse |
| --- | --- | --- |
| Détectée, actuellement non indexée | 55 | **Le vrai sujet.** Pages catalogue slug (artistes + tablatures) jamais crawlées. Aucun blocage technique (canonical, robots, JSON-LD, sitemap OK). Cause : site jeune, faible autorité, maillage interne quasi inexistant dans le HTML servi |
| Explorée, actuellement non indexée | 34 | URLs UUID legacy d'avant la migration slugs. Se résorbe seul (308 en place) |
| Page avec redirection | 24 | URLs UUID legacy, 308 correct vers les slugs. Normal, aucun correctif |
| Introuvable (404) | 4 | `http://apex`, `http://www`, `https://www` (pas de redirection, pas de certif www) + `/about-me` (lien externe mort). **Corrigé** |
| Page en double sans URL canonique | 4 | UUID legacy artistes, crawlées avant la mise en place des 308. Se résorbe seul |
| Page en double : mauvaise canonique Google | 2 | Idem, UUID legacy |
| Erreur liée à des redirections | 1 | Alerte périmée, l'URL redirige en 1 saut vers un 200 |
| Autre page avec balise canonique correcte | 1 | Bénin par définition |

Plus 1 page "indexée sans contenu" : `clerk.michel-lelong-guitar-tab-workshop.com` (sous-domaine
technique Clerk, répond 200 sur sa racine). Non critique, pas de correctif simple, ignoré.

Constat maillage (mesuré sur le HTML servi, ce que voit Googlebot) :
- `/search` : 118 liens produits mais **0 lien artiste** (seul l'onglet actif était rendu)
- Home : 19 liens produits, **0 lien artiste**
- Page produit : **0 lien** vers d'autres tablatures, 1 seul lien vers son artiste

## Correctifs livrés (déployés le 2026-08-10)

1. **Infra** (`45a4c59`) : routeurs Traefik dans `mlmh-shop-app/docker-compose.swarm.yml` :
   `http://apex` → 301 `https://apex` ; `www` (http et https) → 301 apex, avec émission du
   certificat www via `myresolver` (TLS-ALPN). Le Traefik partagé (`~/Code/projects/gobc-swarm`)
   n'a volontairement pas été touché (pas de redirection globale web→websecure pour ne pas
   impacter les autres sites). Plus `/about-me` → 308 `/about` dans `next.config.js`.
   Vérifié en curl : 1 saut, chemin préservé, certif www OK.
2. **Maillage + hubs genres** (`8f6820a`) :
   - pages `/genres/[slug]` (artistes + tablatures du genre), slug dérivé du nom (pas de
     colonne DB), ajoutées au sitemap ;
   - onglet "Genres" dans `/search` (`?category=genre`), et les **trois panneaux du search
     restent dans le DOM** (inactifs masqués en CSS) pour que tous les liens soient crawlables ;
   - pages produit : fil d'Ariane cliquable + sections serveur "More tabs by {artiste}" et
     "Similar tabs" (par genre, autres artistes) ;
   - pages artistes : chips de genres cliquables ; home : section "Browse artists".
3. **Fix layout** (`d962c1e`) : régression introduite par le point 2 (voir Pièges).

## Actions Search Console (datées)

- 2026-08-10 : "Valider la correction" cliqué sur 4 motifs : Introuvable (404), Erreur liée à
  des redirections, et les 2 motifs "Page en double". Google confirme sous ~1 à 2 semaines.
- 2026-08-10 : sitemap resoumis (155 URLs connues avant, les `/genres/*` s'ajoutent).
- 2026-08-11 : demandes d'indexation manuelles (quota ~10/jour) : `/genres/country-blues`,
  `/artists/bob-dylan`, `/artists/mississippi-john-hurt`,
  `/product/tablatures/avalon-mississippi-john-hurt`.

## Calendrier de suivi

- **Vers le 2026-08-25** : vérifier dans GSC que les 4 validations sont passées en "Réussie"
  et que le sitemap affiche ~161+ URLs découvertes. Refaire une fournée de demandes
  d'indexation sur les pages "Détectée non indexée" restantes (prioriser les artistes majeurs
  et les hubs genres).
- **Fin septembre 2026** : mesurer la résorption des ~55 "Détectée, actuellement non indexée".
  Si le compteur n'a pas nettement baissé, le levier suivant n'est PAS technique : backlinks
  (descriptions des vidéos YouTube de Michel avec lien vers chaque tab, annuaires/forums
  guitare, thecountryblues.com qui a déjà un article sur Michel).
- En continu : surveiller que les motifs UUID legacy fondent tout seuls et que le clerk.
  sous-domaine ne pose pas d'autre problème.

## Leviers non lancés (dans l'ordre si besoin)

1. Nouvelles fournées de demandes d'indexation manuelles (10/jour, gratuit, 5 min).
2. Backlinks (voir ci-dessus) : le plus gros levier restant pour un site à faible autorité.
3. Contenu : descriptions plus riches par tablature (histoire du morceau, difficulté,
   accordage), qui différencient les pages entre elles.
4. `scripts/gsc-inspect.ts` (API Search Console, service account droit "Restreint",
   env `GSC_SERVICE_ACCOUNT_KEY_FILE` + `GSC_SITE_URL`) : spec validée le 2026-08-10, en
   attente des étapes manuelles de Martin (création du service account + ajout GSC).
   Permettra de suivre tout ça sans passer par le navigateur.

## Pièges connus (ne pas retomber dedans)

- **Layout racine** : `app/layout.tsx` pose `{children}` dans un `<div className='flex'>`
  (row). Une page qui retourne un fragment à plusieurs enfants visibles les voit posés côte à
  côte (prod cassée le 2026-08-10, fix `d962c1e`). Toujours retourner UNE colonne
  (`w-full flex flex-col`).
- **Audit meta descriptions** : les descriptions en DB contiennent des sauts de ligne ; un
  grep ligne à ligne sur le HTML rate les balises. Faire `tr -d '\n'` avant de grepper.
- **Sitemap GSC** : sur une propriété de domaine, la soumission exige l'URL complète
  (`https://…/sitemap.xml`), pas un chemin relatif.
- **Onglets du search** : ne jamais revenir à un rendu conditionnel des panneaux (SEO) ; les
  panneaux inactifs sont masqués en CSS, pas démontés.
