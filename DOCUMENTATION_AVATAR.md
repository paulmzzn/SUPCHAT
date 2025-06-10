# Documentation - Gestion de l'Avatar/Photo de Profil

## 🎯 Vue d'ensemble

La fonctionnalité de changement d'avatar est implémentée de manière cohérente entre le frontend web et l'application mobile, utilisant la même API backend pour l'upload et la gestion des images de profil.

## 🌐 Frontend Web (Settings.jsx)

### États et variables
```jsx
const [avatarPreview, setAvatarPreview] = useState(null);
const [avatarFile, setAvatarFile] = useState(null);
```

### Interface utilisateur
- **Aperçu d'avatar** : Affiche l'image actuelle ou initiales du nom
- **Bouton de changement** : Overlay avec label "Changer" 
- **Input file caché** : `accept="image/*"` pour sélection d'images

### Workflow
1. **Sélection** : Input file déclenche `handleAvatarChange`
2. **Preview** : FileReader génère un DataURL pour l'aperçu immédiat
3. **Upload** : FormData contient le fichier avec les autres données du profil
4. **Sauvegarde** : PUT vers `/api/users/profile` avec Content-Type multipart/form-data

### Code clé
```jsx
const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setAvatarFile(file);
  const reader = new FileReader();
  reader.onload = () => {
    setAvatarPreview(reader.result);
  };
  reader.readAsDataURL(file);
  setHasChanges(true);
};

// Dans handleSubmit
const formDataToSend = new FormData();
formDataToSend.append("nom", formData.name);
formDataToSend.append("bio", formData.bio);
if (avatarFile) {
  formDataToSend.append("avatar", avatarFile);
}
```

## 📱 Application Mobile

### Écrans impliqués
1. **SettingsScreen.jsx** : Affichage de l'avatar avec icône d'édition
2. **ProfileEditScreen.jsx** : Édition complète du profil + avatar

### SettingsScreen.jsx
- **Affichage** : Avatar avec icône de caméra en overlay
- **Interaction** : Tap pour naviguer vers ProfileEditScreen
- **Visual feedback** : Icône indique que l'avatar est modifiable

```jsx
<TouchableOpacity 
  style={styles.avatarContainer}
  onPress={handleEditProfile}
  activeOpacity={0.8}
>
  {avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
  ) : (
    <Text style={styles.avatarText}>
      {userName?.charAt(0).toUpperCase() || 'U'}
    </Text>
  )}
  <View style={styles.avatarEditIcon}>
    <Ionicons name="camera" size={16} color={themeColors.textOnAccent} />
  </View>
</TouchableOpacity>
```

### ProfileEditScreen.jsx
- **Sélection d'image** : expo-image-picker avec permissions
- **Preview** : Affichage immédiat de l'image sélectionnée
- **Upload** : FormData vers l'API avec multipart/form-data

```jsx
const pickImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (permissionResult.granted === false) {
    Alert.alert("Permission refusée", "Vous devez autoriser l'accès à votre galerie photos...");
    return;
  }
  
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  
  if (!result.canceled && result.assets && result.assets.length > 0) {
    setAvatarUrl(result.assets[0].uri);
    setImageFile({
      uri: result.assets[0].uri,
      type: 'image/jpeg',
      name: 'profile-image.jpg',
    });
  }
};

// Dans handleSubmit
const formData = new FormData();
formData.append('nom', name);
formData.append('bio', bio);

if (imageFile) {
  formData.append('avatar', {
    uri: imageFile.uri,
    type: imageFile.type,
    name: imageFile.name,
  });
}

const response = await fetch(`${env.API_URL}/api/users/profile`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  },
  body: formData,
});
```

## 🔧 Backend (userController.js)

### Endpoint
- **Route** : `PUT /api/users/profile`
- **Middleware** : Authentification JWT
- **Upload** : Multer pour gestion multipart/form-data
- **Stockage** : AWS S3 via s3Service

### Workflow backend
1. **Réception** : FormData avec potentiel fichier avatar
2. **Validation** : Taille, type de fichier
3. **Upload S3** : Si nouveau fichier fourni
4. **Update DB** : URL S3 dans le champ photo_url
5. **Réponse** : Données utilisateur mises à jour

## 🎨 Styling et UX

### Web
- **CSS Grid/Flexbox** : Layout responsive
- **Hover effects** : Feedback visuel sur interaction
- **Loading states** : Indicateurs pendant upload

### Mobile
- **Native components** : TouchableOpacity, Image
- **Theme consistency** : Utilisation du ThemeContext
- **Gestural feedback** : activeOpacity, ripple effects

## 🔒 Sécurité et Validation

### Frontend
- **Type de fichier** : `accept="image/*"` (web) + MediaTypeOptions.Images (mobile)
- **Permissions** : Demande d'accès galerie (mobile)
- **Preview sécurisé** : FileReader DataURL

### Backend
- **Authentification** : JWT token requis
- **Validation fichier** : Type MIME, taille maximale
- **Sanitization** : Nom de fichier sécurisé
- **Storage sécurisé** : S3 avec URLs signées

## 📋 Points d'amélioration possibles

1. **Compression d'image** : Réduire la taille avant upload
2. **Crop interface** : Permettre le recadrage avant sauvegarde
3. **Multiple formats** : Support WebP, AVIF
4. **Progress tracking** : Indicateur de progression d'upload
5. **Offline handling** : Gestion des uploads en mode hors-ligne
6. **Image optimization** : Génération de thumbnails automatique

## ✅ Status d'implémentation

- ✅ Frontend Web : Complet et fonctionnel
- ✅ Application Mobile : Complet et fonctionnel
- ✅ Backend API : Complet avec S3 storage
- ✅ UI/UX cohérent : Thème uniforme entre plateformes
- ✅ Sécurité : Authentification et validation appropriées

La fonctionnalité de changement d'avatar est maintenant complètement implémentée et cohérente sur toutes les plateformes.
