# Système de Mentions pour Mobile

Ce document décrit l'implémentation du système de mentions d'utilisateurs adapté à l'interface mobile de SUPCHAT.

## Vue d'ensemble

Le système de mentions mobile permet aux utilisateurs de mentionner d'autres membres du workspace en tapant `@` suivi du nom de l'utilisateur. Un panneau de suggestions s'affiche automatiquement avec une interface optimisée pour les écrans tactiles.

## Composants

### 1. `useMentions` Hook
**Fichier**: `src/hooks/useMentions.js`

Hook personnalisé qui gère toute la logique des mentions :
- Détection du caractère `@` et filtrage des utilisateurs
- Gestion de la navigation dans les suggestions
- Conversion des mentions au format approprié
- États pour l'affichage du panneau de suggestions

**Méthodes principales** :
- `fetchMentionableUsers(workspaceId)` : Récupère les membres du workspace
- `handleMentionInput(text, cursorPosition)` : Détecte les mentions dans le texte
- `selectMention(user, currentText, cursorPosition)` : Sélectionne une mention
- `navigateMentions(direction)` : Navigation clavier dans les suggestions

### 2. `MentionSuggestions` Composant
**Fichier**: `src/components/MentionSuggestions/MentionSuggestions.jsx`

Interface utilisateur pour afficher les suggestions de mentions :
- Liste optimisée avec FlatList pour les performances
- Avatars des utilisateurs avec indicateurs de statut
- Badge spécial pour Mistral AI (bot)
- Interface tactile avec feedbacks visuels

**Props** :
- `suggestions` : Liste des utilisateurs suggérés
- `activeMentionIndex` : Index de l'élément sélectionné
- `onSelectMention` : Callback pour la sélection
- `themeColors` : Couleurs du thème
- `visible` : Contrôle l'affichage

### 3. `MessageInputWithMentions` Composant
**Fichier**: `src/components/MessageInput/MessageInputWithMentions.jsx`

Version améliorée du MessageInput avec support des mentions :
- Détection en temps réel du texte saisi
- Affichage du panneau de suggestions
- Gestion de la position du curseur
- Intégration avec FileUploader et ReplyPreview

### 4. Utilitaires de rendu
**Fichier**: `src/utils/mentionUtils.js`

Fonctions pour traiter et afficher les mentions dans les messages :
- `renderTextWithMentions()` : Convertit les mentions en composants cliquables
- `stripMentionFormatting()` : Supprime le formatage des mentions

## Format des mentions

### Format visible pour l'utilisateur
```
@Username
```

### Format interne pour l'envoi
```
@[userId:username]
```

### Format de stockage backend
```
@[userId:username]
```

## Intégration

### Dans WorkspaceDetailScreen

```jsx
import MessageInputWithMentions from '../../components/MessageInput/MessageInputWithMentions';

// Handler pour les clics sur mentions
const handleUserPress = useCallback((userId, userName) => {
  navigation.navigate('Messages', {
    screen: 'Conversation',
    params: {
      recipientId: userId,
      recipientName: userName
    }
  });
}, [navigation]);

// Dans le render
<MessageInputWithMentions
  value={newMessage}
  onChangeText={handleInputChange}
  onSend={sendMessage}
  workspaceId={workspaceId}
  channelId={channelId}
  // ... autres props
/>

<MessageList
  // ... autres props
  onUserPress={handleUserPress}
/>
```

### Dans useMessageActions Hook

Le hook a été modifié pour convertir automatiquement les mentions au format attendu par le backend avant l'envoi.

## Interface utilisateur

### Panneau de suggestions
- **Position** : Au-dessus du champ de saisie
- **Hauteur max** : 240px avec scroll
- **Animations** : Transitions fluides
- **Design** : Cards avec ombre et bordures arrondies

### Éléments de suggestion
- **Avatar** : Image ou initiale avec badge bot si applicable
- **Nom** : Nom complet de l'utilisateur
- **Statut** : Indicateur coloré (en ligne, absent, etc.)

### Mentions dans les messages
- **Style** : Texte en surbrillance avec couleur d'accent
- **Interaction** : Tactile avec navigation vers conversation privée

## Responsive et accessibilité

- **Touch targets** : Minimum 44px pour faciliter l'interaction
- **Feedback visuel** : États actifs et hover
- **Performance** : FlatList avec optimisations React Native
- **Keyboard handling** : Gestion native du clavier mobile

## États et données

### Utilisateurs mentionnables
1. **Mistral AI** (toujours en premier)
2. **Membres en ligne** du workspace
3. **Membres hors ligne** du workspace

### Filtrage
- Recherche insensible à la casse
- Correspondance sur nom et username
- Résultats instantanés pendant la frappe

## Exemple d'utilisation

1. L'utilisateur tape `@` dans le champ de message
2. Le panneau de suggestions apparaît avec tous les membres
3. L'utilisateur continue à taper → filtrage en temps réel
4. L'utilisateur peut :
   - Taper pour filtrer
   - Toucher une suggestion
   - Utiliser la navigation clavier (si disponible)
5. La mention est insérée au format `@[nom](id)`
6. À l'envoi, conversion automatique vers `@[id:nom]`
7. À l'affichage, rendu interactif avec `renderTextWithMentions()`

## Performance

- **Debouncing** : Évite les requêtes excessives
- **Mémisation** : Composants optimisés avec React.memo
- **FlatList** : Rendu efficace des grandes listes
- **Lazy loading** : Chargement des avatars à la demande
