# Audit des fautes d'anglais — catalogue (titres de tabs & artistes)

Source : données live de prod (`/api/tablatures/names`, `/api/artists/names`, sitemap), 2026-08-07.
À corriger via le dashboard admin (les corrections de **titre** ne changent PAS le slug/URL —
aucun risque SEO ; corriger un **slug** casserait l'URL indexée → à ne faire qu'avec une
redirection 301, voir §4).

## 1. Fautes d'orthographe claires (titres)

| Titre actuel | Correction | Note |
|---|---|---|
| Sunny **Tenessee** (Etta Baker) | Sunny **Tennessee** | ⚠️ existe en DOUBLE (voir §3) |
| Sunny **Tennesse** (Etta Baker) | Sunny **Tennessee** | idem — doublon |
| **Raildoad** Bill | **Railroad** Bill | |
| **Penitenciary** Blues | **Penitentiary** Blues | |
| **Mistery** Train (Sam **Philips**) … | **Mystery** Train (Sam **Phillips**) | + doublon « Mystery train » (§3) |
| I Shall Not Be **Move** | I Shall Not Be **Moved** | |
| **King** Hearted Woman (Johnny Shines) | **Kind** Hearted Woman | pas un doublon : la version Robert Johnson (« Kindhearted Woman ») est une autre fiche |
| **Greeville** Trestle High  (Doc Watson | **Greenville** Trestle High (Doc Watson) | + double espace + parenthèse non fermée |
| That' s **Allwright** Mama ( Arthur Crudup | That's **All Right** Mama (Arthur Crudup) | + espace parasite + parenthèse non fermée |
| Don't think twice it's **allwright** (Bob Dylan) | Don't Think Twice, It's **All Right** | « Allwright » n'est correct que pour l'artiste Graeme Allwright |
| Thinkin' and **Worryn'** | Thinkin' and **Worryin'** | |
| Come Back Baby (Mance **Lispcomb**) | Come Back Baby (Mance **Lipscomb**) | |
| Cocaïne Blues | **Cocaine** Blues | orthographe française → anglaise (signalé par un client) |
| From four **'till** late | From Four **Till** Late | titre original Robert Johnson : « From Four Until Late » |
| Where are the flowers gone | **Where Have All the Flowers Gone** | titre officiel (Pete Seeger) |
| Georgia On My Mind (Howard Hoagland &quot;Hoagy&quot; Carmichael (1899 | Georgia On My Mind (Hoagy Carmichael) | titre tronqué + entités HTML + parenthèses déséquilibrées |
| Gipsy Woman | **Gypsy** Woman | « Gipsy » est une variante archaïque ; le titre Muddy Waters est « Gypsy Woman » |

## 2. Noms d'artistes

| Actuel | Correction |
|---|---|
| Brownie **Mc Ghee** | Brownie **McGhee** |
| **Elisabeth** Cotten | **Elizabeth** Cotten |
| **Lightnin** Hopkins | **Lightnin'** Hopkins |
| **Freddy** King | **Freddie** King (orthographe usuelle) |
| « Fred **Mc Dowell** » dans plusieurs titres | Fred **McDowell** (la fiche artiste est déjà correcte) |

## 3. Doublons à trancher (Michel décide)

- **Sunny Tenessee / Sunny Tennesse** (toutes deux Etta Baker) → garder une seule fiche
  (attention : si l'une a des ventes, la masquer via `hidden` plutôt que la supprimer).
- **Mistery Train** (arrgt Chet Atkins, Tr. Michel Lelong) vs **Mystery train** → même morceau ?
- **That' s Allwright Mama** (slug artiste ray-charles ?!) vs **That's all right Mama** → vérifier
  aussi l'artiste associé à la première.
- **The Banks Of The Ohio** vs **The Banks of the Ohio (Trad.) Arrgt Doc Watson Tr. Michel
  Lelong** → même morceau ?
- **Careless Love** ×2 et **Joe Turner / Joe Turner Blues** : probablement des versions
  différentes (artistes différents) — vérifier que c'est voulu.
- **All The Ways To St Louis (Fred Mc Dowell)** vs **All the way to East St Louis** → à vérifier.

## 4. Parenthèses non fermées / ponctuation (titres tronqués)

- Deep Elem Blues (Trad. Arrgt. Larry Campbell **←)**
- Precious Lord (T.A. Dorsey **←)**
- St Louis Blues (W.C Handy **←)** — et « W.C**.** Handy »
- John's Ragtime (John Jackson **←)**
- Truckin' Little Baby (Blind Boy Fuller Arrgt John Jackson **←)**
- Below Freezing (Michael T**.**Coleman) → « T. Coleman » (espace)

## 5. À vérifier avec Michel (pas sûr que ce soit une faute)

- **Chilly Wings** → « Chilly Winds » ? (le morceau trad/Doc Watson s'appelle Chilly Winds)
- **First Mail Rambler** → titre à confirmer
- **Charley James** (Lightnin' Hopkins) → souvent orthographié « Charlie James »
- **Stocktime Buck Dance** (John Hurt) → orthographe à confirmer
- **Hello my baby** → le standard de 1899 s'écrit « Hello! Ma Baby »

## 6. Cohérence de casse (optionnel, cosmétique)

Le catalogue mélange Title Case (« Big Bill Blues ») et sentence case (« Beulah land »,
« Early morning blues », « The stumble », « Windy and warm », « Mississippi blues », « Old
country rock », « Going up the country », « Take me home, country roads »…). Recommandation :
tout passer en **Title Case** anglais (« Beulah Land », « Windy and Warm », …).

## 7. Slugs mal orthographiés (SEO — plus tard, avec 301)

Corriger un titre ne change pas le slug : les URLs restent valides. Les slugs suivants
contiennent les fautes d'origine ; ne les corriger que si on ajoute une redirection 301
(`next.config.js` `redirects()`) de l'ancien slug vers le nouveau :
`sunny-tenessee-etta-baker`, `sunny-tennesse-etta-baker`, `raildoad-bill-etta-baker`,
`penitenciary-blues-lightnin-hopkins`, `king-hearted-woman-johnny-shines`,
`greeville-trestle-high-doc-watson-doc-watson`, `mistery-train-…`, `that-s-allwright-mama-…`,
`dont-think-twice-its-allwright-…`.
