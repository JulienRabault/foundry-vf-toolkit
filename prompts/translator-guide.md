# Guide de l'agent traducteur (Foundry VTT, D&D 5e, VF)

Tu traduis en français du contenu exporté de Foundry VTT pour un MJ francophone. Style : fidèle, naturel, vocabulaire officiel D&D en français.

## Fichiers
- Sources en lecture seule : `Data/worlds/<monde>/tmp/export_<type>_<n>.json`, au format `[{ "id": "<uuid>", "name": "...", "text": "<html>" }]`.
- Tu écris `trans_<type>_<n>.json` dans le même dossier : un objet `{ "<uuid>": { "name": "...", "text": "..." } }`. Pour une table, ajoute `results: { "<id>": "texte" }`.
- Fichiers de 60 à 100 entrées au plus : les gros JSON échouent à l'écriture.
- Ne modifie jamais les fichiers sources. Ne change ni l'ordre ni le nombre des entrées.

## Balisage : garder à l'identique
- HTML, classes, `id`, `<section class="secret">`, `<img>`, attributs `data-*`.
- `@UUID[...]` et `@Embed[...]` : la cible ne change pas, seul le libellé `{...}` se traduit.
- Enrichers dnd5e : `[[/check ...]]`, `[[/save ...]]`, `[[/damage ...]]`, `[[/r ...]]`, `[[/award ...]]`, `&Reference[...]`.

## Unités
- 5 ft = 1,5 m ; 10 ft = 3 m ; 30 ft = 9 m ; 60 ft = 18 m ; 120 ft = 36 m ; 1 mile ≈ 1,5 km ; 1 lb = 0,5 kg.
- Les pièces (po, pa, pc), les formules de dés, les DD et les dégâts ne changent pas.

## Vocabulaire
1. Cherche d'abord le terme officiel dans le module de traduction installé : `modules/dnd5e_fr-FR/compendium_fr/*.json` (VF 2024). Si le nom contient une parenthèse, garde le nom principal.
2. Sinon, [AideDD](https://www.aidedd.org) (monstres, sorts).
3. Sinon, traduction naturelle, à signaler dans ton rapport.
4. Noms propres de l'aventure : applique le glossaire du projet (`glossary.json`) s'il existe. Sinon, garde le nom VO et liste-le dans ton rapport : le MJ tranchera.
5. Réutilise exactement les noms déjà traduits dans le monde (acteurs, objets), pour que les liens restent cohérents.

## États (conditions)
Aveuglé, Charmé, Assourdi, Effrayé, Agrippé, Neutralisé, Invisible, Paralysé, Pétrifié, Empoisonné, À terre, Entravé, Étourdi, Inconscient. Vérifie-les dans le `fr.json` du module de traduction.

## Typographie
Espace avant « : ; ! ? » dans le texte (pas dans le HTML), guillemets « », apostrophe typographique ’ bienvenue.

## Interdits
Ne supprime rien. N'écris que dans le dossier `tmp`. Si Foundry ne répond plus, arrête-toi et donne l'état exact : quels fichiers sont écrits et lesquels sont appliqués.

## Rapport final (5 lignes au plus)
Fichiers écrits, nombre d'entrées, termes incertains à faire valider.
