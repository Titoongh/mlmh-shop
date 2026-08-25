# API & actions admin — référence

Cette doc décrit **toutes les opérations d'administration** du catalogue (tablatures, artistes,
genres) et leurs trois points d'entrée. C'est la référence à utiliser comme « tools » par le
CLI (`scripts/tab-uploader.ts`), le skill `/upload-tab` et Claude pour le debug ou les
corrections de contenu.

## Architecture en 3 couches

```
lib/admin/*            ← logique métier unique (validation zod, slug, revalidation)
   ├── lib/actions/admin.ts   ← server actions (UI /admin, protégées requireAdmin())
   └── app/api/admin/*        ← routes REST (CLI/outillage, protégées par le middleware)
```

- **`lib/admin/`** : `tablatures.ts`, `artists.ts`, `genres.ts`, `validation.ts` (schémas zod),
  `auth.ts` (`requireAdmin`), `errors.ts`. Les fonctions valident, écrivent, revalident le cache
  Next, et jettent en cas d'erreur. C'est LA source de vérité — toute nouvelle opération admin
  se code ici d'abord.
- **Server actions** (`lib/actions/admin.ts`) : wrappers fins pour l'UI. Chacune appelle
  `requireAdmin()` (rôle Clerk `org:admin`) — jamais uniquement le middleware. Retours
  `{ success: true, id? } | { error: string }`.
- **Routes REST** : wrappers fins, mêmes contrats qu'historiquement (le CLI tab-uploader
  fonctionne sans changement).

## Auth des routes REST

Le middleware (`proxy.ts`) protège `/api/admin/*` : session Clerk avec rôle `org:admin`, **ou**
header `x-admin-api-key` égal à l'env `ADMIN_API_KEY` du déploiement (fail-closed si non
défini). Pour l'outillage local :

```bash
BASE=http://localhost:3000     # ou l'URL prod
KEY=<ADMIN_API_KEY>            # jamais en clair dans le repo — cf. scripts/.tab-uploader.config.json
curl -s -H "x-admin-api-key: $KEY" "$BASE/api/admin/tablatures" | head -c 500
```

## Endpoints

### Tablatures

| Méthode & chemin | Rôle |
|---|---|
| `GET /api/admin/tablatures?q=&hidden=` | Liste (recherche titre/artiste, filtre `hidden=true\|false`) |
| `POST /api/admin/tablatures` | Création |
| `GET /api/admin/tablatures/{id}` | Détail (artistes, genres, contents, fichiers) |
| `PUT /api/admin/tablatures/{id}` | Mise à jour partielle |
| `PUT /api/admin/tablatures/{id}/hide` | `{ "hidden": true\|false }` — masquer/afficher |
| `DELETE /api/admin/tablatures/{id}` | ⚠️ suppression définitive — outillage seulement, l'UI n'expose que `hidden` ; échoue si des ventes y sont liées |

Corps de `POST` (create) — champs inconnus ignorés, validation zod
(`lib/admin/validation.ts`) :

```jsonc
{
  "title": "Cocaine Blues",            // requis
  "price": 3.5,                        // défaut 3.5
  "description": null,                 // string | null
  "hidden": false,
  "publicationDate": "2026-08-07",     // optionnel
  "artists": ["<artistId>"],           // requis, ≥ 1
  "musicalGenres": ["<genreId>"],      // défaut []
  "contents": [{ "type": "VIDEO", "url": "https://youtube.com/…", "rank": 1 }],
  "files": [{ "filename": "cocaine.pdf", "scalewayKey": "…", "fileSize": 12345, "mimeType": "application/pdf" }]
}
```

`PUT` (update) : mêmes champs, **tous optionnels**. Une relation absente du payload n'est pas
touchée ; une relation fournie est remplacée intégralement. Le `slug` n'est JAMAIS modifié
(stabilité des URLs) — seulement backfillé s'il manque.

Exemple — corriger une faute dans un titre (l'URL publique ne change pas) :

```bash
curl -s -X PUT -H "x-admin-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"title": "Railroad Bill"}' "$BASE/api/admin/tablatures/<id>"
```

### Méthodes

| Méthode & chemin | Rôle |
|---|---|
| `GET /api/admin/methods?q=&hidden=` | Liste (+ `_count.lessons/files/offers`) |
| `POST /api/admin/methods` | Création |
| `GET /api/admin/methods/{id}` | Détail (artistes, genres, contents, leçons, fichiers, offres) |
| `PUT /api/admin/methods/{id}` | Mise à jour partielle (voir règle du trio ci-dessous) |
| `PUT /api/admin/methods/{id}/hide` | `{ "hidden": bool }` |
| `DELETE /api/admin/methods/{id}` | ⚠️ outillage seulement ; échoue (FK Restrict) si une offre a été vendue |

**`lessonRef`** : les fichiers et offres pointent leurs leçons via une référence CLIENT.
Pour une leçon existante, `ref` = son id DB ; pour une nouvelle, n'importe quelle chaîne
(`"l1"`, `"lesson-guitar-rag"`, …), résolue côté serveur dans la même requête.

Corps de `POST` (create) :

```jsonc
{
  "title": "The Guitar Of Merle Travis - Volume 2",  // requis
  "description": null,
  "hidden": false,
  "publicationDate": "1987-01-01",                   // optionnel
  "artists": ["<artistId>"],                         // OPTIONNEL (défaut [])
  "musicalGenres": ["<genreId>"],
  "contents": [{ "type": "IMAGE", "url": "…", "rank": 1 }],
  "lessons": [
    { "ref": "l1", "title": "Muskrat Ramble", "rank": 1 },
    { "ref": "l2", "title": "Guitar Rag", "rank": 2 }
  ],
  "files": [
    // lessonRef absent/null = fichier niveau méthode (ex. couverture)
    { "filename": "cover.pdf", "scalewayKey": "methods/…", "role": "DOCUMENT" },
    { "filename": "guitar-rag.pdf", "scalewayKey": "methods/…", "role": "DOCUMENT", "lessonRef": "l2" },
    { "filename": "guitar-rag.mp3", "scalewayKey": "methods/…", "role": "AUDIO", "lessonRef": "l2" }
  ],
  "offers": [
    // l'unité VENDABLE ; livraison dérivée de kind + role/lessonId des fichiers
    { "kind": "FULL", "title": "Complete package", "price": 24.95 },
    { "kind": "DOCUMENTS", "title": "PDF booklet", "price": 17 },
    { "kind": "LESSON", "lessonRef": "l2", "title": "Lesson: Guitar Rag", "price": 6 }
  ]
}
```

Invariants (validés serveur) : max 1 offre FULL et 1 DOCUMENTS visibles par méthode,
1 offre LESSON visible par leçon ; `lessonRef` requis ssi `kind = LESSON`.

`PUT` (update) : champs scalaires/artistes/genres/contents optionnels (mêmes règles que
tablatures). **`lessons`, `files` et `offers` se mettent à jour ENSEMBLE** (les trois
fournis, remplacement de la structure) ou pas du tout. Réconciliation : leçons upsertées
par `ref` (supprimées si absentes, cascade fichiers) ; fichiers remplacés intégralement ;
offres upsertées par `id` — une offre absente du payload est passée `hidden`, jamais
supprimée (des `PurchaseItem` peuvent y être rattachés).

### Artistes

| Méthode & chemin | Rôle |
|---|---|
| `GET /api/admin/artists?q=&hidden=` | Liste (+ `_count.tablatures`) |
| `POST /api/admin/artists` | Création — `{ name*, description, hidden, musicalGenres: [], contents: [] }` |
| `GET /api/admin/artists/{id}` | Détail |
| `PUT /api/admin/artists/{id}` | Mise à jour partielle (mêmes règles que tablatures) |
| `PUT /api/admin/artists/{id}/hide` | `{ "hidden": bool }` |
| `DELETE /api/admin/artists/{id}` | ⚠️ outillage seulement |

La photo d'artiste est un content `{ "type": "IMAGE", "url": "…", "rank": 1 }`.

### Genres musicaux

| Méthode & chemin | Rôle |
|---|---|
| `GET /api/admin/musical-genres` | Liste avec compteurs d'usage |
| `POST /api/admin/musical-genres` | `{ "name": "Ragtime" }` |
| `PUT /api/admin/musical-genres/{id}` | Renommage |
| `DELETE /api/admin/musical-genres/{id}` | Suppression (délie seulement, aucune donnée de vente) |

### Uploads de fichiers (multipart, inchangés)

| Méthode & chemin | Rôle |
|---|---|
| `POST /api/admin/upload` | 1 fichier (`file`) → bucket général (photos, bonus). Retour `{ url, key, filename, contentType }` |
| `POST /api/admin/upload/tablature` | N fichiers (`files` + `title`, ext. pdf/gp3-5/gpx/mid) → bucket tablatures. Retour `{ success, files: [{ filename, scalewayKey, fileSize, mimeType }] }` |
| `POST /api/admin/upload/method` | N fichiers (`files` + `title`, ext. pdf/txt/jpg/jpeg/mp3/mp4) → même bucket privé, clés préfixées `methods/<titre>/…`. Même shape de retour |

Flux de création complet : **1)** uploader les fichiers → **2)** `POST /api/admin/tablatures`
(ou `/api/admin/methods` avec le câblage `lessonRef`) avec les métadonnées retournées.
C'est ce que fait le CLI (`scripts/tab-uploader.ts`) et ce que fera `method-uploader`.

## Erreurs

Toutes les routes renvoient `{ "error": "message" }` avec le bon statut : 400 (validation zod /
référence invalide), 404 (introuvable), 409 (doublon — contrainte unique), 500 (inattendu).
Messages en français (`lib/admin/errors.ts`).

## UI

L'interface d'administration (en français, pour Michel) vit sur **`/admin`**
(`/dashboard` redirige) : listes avec recherche/filtres, formulaires de création/édition,
gestion des genres. Pas de suppression de tabs/artistes dans l'UI — uniquement le masquage
(`hidden`), réversible.
