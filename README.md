# Astarté React - Assistant Éducatif (Proxy Apps Script)

## Structure du Google Sheet

| A (Groq) | B (Fireworks) | C (OpenRouter) | D (Modèle Groq) | E (Modèle Fireworks) | F (Modèle OpenRouter) | G (Historique) | H (UserID) |
|----------|--------------|----------------|-----------------|---------------------|-----------------------|----------------|------------|
| gsk_abc  |              |                | llama-3.3-70b   |                     |                       | JSON auto      | user_123.. |
|          | fw_xyz       |                |                 | mixtral-8x7b        |                       | JSON auto      | user_456.. |
|          |              | sk-or-abc      |                 |                     | gemini-flash-1.5     | JSON auto      |            |

- Colonnes A-C : Clés API par provider
- Colonnes D-F : Modèles (optionnels)
- Colonne G : Historique de conversation (JSON, géré automatiquement)
- Colonne H : ID utilisateur (géré automatiquement)

## Fonctionnement de l'historique
- Chaque utilisateur reçoit un ID unique stocké en localStorage
- L'historique (20 derniers messages) est sauvegardé dans la colonne G
- Le contexte est envoyé au LLM pour des conversations continues
- Chaque utilisateur a sa propre ligne dans le Sheet

## Déploiement
1. Copier AppsScript.gs dans le Sheet (Extensions > Apps Script)
2. Déployer en Application Web (accès : Tout le monde)
3. Mettre l'URL dans .env > REACT_APP_APPS_SCRIPT_URL
4. npm install && npm start
