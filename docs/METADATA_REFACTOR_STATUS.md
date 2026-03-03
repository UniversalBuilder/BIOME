# BIOME v2.4.0 - Refonte de la gestion des métadonnées projet

## Statut d'implémentation : Phase 1 Complétée (Backend)

### ✅ Complété

#### 1. Suppression de 'Objective Magnification'
- ✅ Schéma de base de données (web et desktop)
- ✅ Routes API projects.js (web et desktop  
- ✅ Composants UI (ProjectDetails, ProjectCreationWizard)

#### 2. Table metadata_options
- ✅ Schéma créé dans les deux backends
- ✅ Index sur (category, is_active) pour performance
- ✅ Contrainte UNIQUE sur (category, value)

#### 3. Scripts de seed
- ✅ backend/src/database/seed-metadata-options.js
- ✅ src-tauri/resources/backend/src/database/seed-metadata-options.js
- Initialise les 4 catégories avec toutes les valeurs actuelles

#### 4. Routes API metadata-options
- ✅ GET /api/metadata-options?category=X - Liste des options actives
- ✅ GET /api/metadata-options/:id - Détail d'une option
- ✅ POST /api/metadata-options - Créer une option
- ✅ PUT /api/metadata-options/:id - Modifier une option
- ✅ DELETE /api/metadata-options/:id - Supprimer (avec vérif. usage)
- ✅ PUT /api/metadata-options/reorder/:category - Réorganiser
- ✅ Routes enregistrées dans les deux serveurs

#### 5. Script de migration v2.4.0
- ✅ Suppression automatique de objective_magnification
- ✅ Conversion software (string → JSON array)
- ✅ Seed automatique de metadata_options
- ✅ Backup automatique avant migration
- ✅ Rollback en cas d'erreur
- ✅ Versions web et desktop

#### 6. Service API frontend
- ✅ src/services/metadataOptionsApi.js
- ✅ getAllOptions() - Charge les 4 catégories
- ✅ createOption(), updateOption(), deleteOption()
- ✅ reorderOptions() - Pour drag-and-drop
- ✅ Gestion d'erreur 409 pour suppression bloquée

---

### 🚧 En cours / À faire (Phase 2 - Frontend)

#### 7. Mise à jour des composants pour options dynamiques

**ProjectDetails.js** - À faire :
- [ ] Supprimer PREDEFINED_OPTIONS
- [ ] Importer metadataOptionsApi
- [ ] Ajouter state pour options chargées
- [ ] useEffect pour charger options au montage
- [ ] Convertir Software de `<select>` en `<MultiSelectField>`
- [ ] Passer options dynamiques aux MultiSelectField

**ProjectCreationWizard.js** - À faire :
- [ ] Même pattern que ProjectDetails
- [ ] Loader pendant chargement des options
- [ ] Fallback si API échoue

**Analytics.js** - À faire :
- [ ] Supprimer PREDEFINED_CATEGORIES
- [ ] Charger options dynamiquement
- [ ] Adapter parseMultiSelectionField() pour options dynamiques
- [ ] Adapter graphiques (pie charts)
- [ ] Adapter export Excel

#### 8. Interface d'administration (Settings)

**MetadataOptionsManager.js** - À créer :
- [ ] Composant avec onglets (Software / Techniques / Sample / Goals)
- [ ] Liste triable (drag-and-drop) des options
- [ ] Bouton "Add New Option" → modal
- [ ] Bouton Edit (renommer)
- [ ] Bouton Delete (avec confirmation et gestion erreur 409)
- [ ] Toast notifications pour succès/erreur

**Settings.js** - À modifier :
- [ ] Ajouter carte "Metadata Management" full-width
- [ ] Intégrer MetadataOptionsManager

---

## Fichiers créés

### Backend Web
- `backend/src/database/schema.js` (modifié)
- `backend/src/database/seed-metadata-options.js` (nouveau)
- `backend/src/database/migrate-v2.4.0.js` (nouveau)
- `backend/src/routes/metadata-options.js` (nouveau)
- `backend/src/routes/projects.js` (modifié)
- `backend/src/server.js` (modifié)

### Backend Desktop (Tauri)
- `src-tauri/resources/backend/src/database/schema.js` (modifié)
- `src-tauri/resources/backend/src/database/seed-metadata-options.js` (nouveau)
- `src-tauri/resources/backend/src/database/migrate-v2.4.0.js` (nouveau)
- `src-tauri/resources/backend/src/routes/metadata-options.js` (nouveau)
- `src-tauri/resources/backend/src/routes/projects.js` (modifié)
- `src-tauri/resources/backend/src/server.js` (modifié)

### Frontend
- `src/services/metadataOptionsApi.js` (nouveau)
- `src/components/ProjectDetails.js` (modifié - objective_magnification supprimé)
- `src/components/ProjectCreationWizard.js` (modifié - objective_magnification supprimé)

---

## Prochaines étapes recommandées

### Étape 1 : Tester le backend
```powershell
# Exécuter migration sur base existante
cd backend
node src/database/migrate-v2.4.0.js

# Vérifier que la table metadata_options existe et est peuplée
# Tester les endpoints API avec curl ou Postman
```

### Étape 2 : Compléter le frontend
1. Mettre à jour ProjectDetails.js (software multi-select + options dynamiques)
2. Mettre à jour ProjectCreationWizard.js (options dynamiques)
3. Mettre à jour Analytics.js (agrégation dynamique)
4. Créer MetadataOptionsManager.js (interface admin)
5. Intégrer dans Settings.js

### Étape 3 : Tests end-to-end
1. Créer un projet avec nouvelles options custom
2. Modifier/supprimer des options dans Settings
3. Vérifier Analytics avec options custom
4. Tester blocage de suppression d'option en usage
5. Tester conversion automatique de software (string → array)

---

## Notes techniques

### Conversion Software en multi-select
La migration convertit automatiquement les valeurs existantes :
- `'Fiji'` → `'["Fiji"]'`
- `null` → `'[]'`

Les anciens projets continueront de fonctionner après migration.

### Performance
Index créé sur `(category, is_active)` pour optimiser les requêtes fréquentes :
```sql
CREATE INDEX idx_metadata_options_category ON metadata_options(category, is_active)
```

### Robustesse
- Backup automatique avant migration
- Rollback en cas d'erreur
- Validation côté serveur des valeurs metadata
- Blocage de suppression si option en usage

---

## Changements breaking

### Pour les utilisateurs
- Le champ "Objective Magnification" n'est plus disponible
- Le champ "Software" permet désormais de sélectionner plusieurs logiciels

### Pour les développeurs
- `PREDEFINED_OPTIONS` supprimé → utiliser API dynamique
- `project.software` est maintenant un JSON array string
- Nouveaux endpoints `/api/metadata-options/*`

---

**Dernière mise à jour** : 2026-03-03  
**Version cible** : BIOME v2.4.0
