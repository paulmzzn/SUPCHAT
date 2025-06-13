import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const renderTextWithMentions = (text, themeColors, onUserPress, textStyle = {}, isOwnMessage = false) => {
  console.log('🔍 renderTextWithMentions called with text:', text);
  
  if (!text || typeof text !== 'string') {
    return <Text style={textStyle}>{text}</Text>;
  }

  // Regex pour détecter les mentions dans les différents formats :
  // Format 1: @[id:nom] (format existant)
  // Format 2: @[nom](id:uuid) (avec préfixe id:)
  // Format 3: @[nom](uuid) (sans préfixe id:)
  const mentionRegex1 = /@\[([^:]+):([^\]]+)\]/g;
  const mentionRegex2 = /@\[([^\]]+)\]\(id:([^)]+)\)/g;
  const mentionRegex3 = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  
  // Trouver toutes les mentions dans les différents formats
  const allMentions = [];
  
  // Format 1: @[id:nom]
  let match1;
  while ((match1 = mentionRegex1.exec(text)) !== null) {
    allMentions.push({
      match: match1,
      index: match1.index,
      userId: match1[1],
      userName: match1[2],
      fullMatch: match1[0]
    });
  }
  
  // Format 2: @[nom](id:uuid)
  let match2;
  while ((match2 = mentionRegex2.exec(text)) !== null) {
    allMentions.push({
      match: match2,
      index: match2.index,
      userId: match2[2],
      userName: match2[1],
      fullMatch: match2[0]
    });
  }
  
  // Format 3: @[nom](uuid) - NOUVEAU FORMAT
  let match3;
  while ((match3 = mentionRegex3.exec(text)) !== null) {
    // Vérifier que ce n'est pas déjà traité par le format 2
    const isAlreadyProcessed = allMentions.some(m => m.index === match3.index);
    if (!isAlreadyProcessed) {
      allMentions.push({
        match: match3,
        index: match3.index,
        userId: match3[2],
        userName: match3[1],
        fullMatch: match3[0]
      });
    }
  }
  
  // Trier les mentions par position dans le texte
  allMentions.sort((a, b) => a.index - b.index);
  
  console.log('📝 Found mentions:', allMentions.length, allMentions);

  for (const mention of allMentions) {
    // Ajouter le texte avant la mention
    if (mention.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={[textStyle, { color: 'inherit' }]}>
          {text.substring(lastIndex, mention.index)}
        </Text>
      );
    }

    // Ajouter la mention avec style de badge oblong
    const userId = mention.userId;
    const userName = mention.userName;
    
    // Couleurs selon le type de message - VERSION MODERNE
    const badgeColors = isOwnMessage 
      ? {
          backgroundColor: '#F3F4F6', // Gris très clair et moderne pour mes messages
          textColor: '#374151'        // Texte sombre contrasté
        }
      : {
          backgroundColor: '#8B5CF6', // Violet moderne (plus vibrant)
          textColor: '#FFFFFF'        // Texte blanc pur
        };
    
    parts.push(
      <View
        key={`mention-wrapper-${mention.index}`}
        style={{
          alignSelf: 'baseline',
          marginHorizontal: 3,
          marginVertical: 0,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: badgeColors.backgroundColor,
            borderRadius: 25,           // Capsule parfaite
            paddingHorizontal: 14,      // Padding large pour l'effet oblong
            paddingVertical: 5,         // Padding vertical modéré
            minWidth: 60,               // Largeur minimale pour forcer l'oblong
            height: 30,                 // Hauteur fixe pour la forme parfaite
            justifyContent: 'center',   // Centre le texte verticalement
            alignItems: 'center',       // Centre le texte horizontalement
            // Ombre moderne pour iOS
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            // Ombre pour Android
            elevation: 3,
          }}
          onPress={() => onUserPress && onUserPress(userId, userName)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color: badgeColors.textColor,
              fontWeight: '700',        // Bold moderne
              fontSize: 13,             // Taille optimale
              textAlign: 'center',
              includeFontPadding: false, // Supprime les paddings automatiques
              lineHeight: 13,           // Ligne hauteur serrée pour éviter l'espace
            }}
          >
            @{userName}
          </Text>
        </TouchableOpacity>
      </View>
    );

    lastIndex = mention.index + mention.fullMatch.length;
  }

  // Ajouter le texte restant après la dernière mention
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={[textStyle, { color: 'inherit' }]}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  // Si aucune mention trouvée, retourner le texte normal
  if (parts.length === 0) {
    return <Text style={textStyle}>{text}</Text>;
  }

  // Retourner le texte avec les mentions stylisées
  return (
    <View style={{ 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      alignItems: 'center',
      marginVertical: 0,  // Pas d'espacement vertical
    }}>
      {parts}
    </View>
  );
};

export const stripMentionFormatting = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Remplacer les mentions dans les différents formats par @nom
  // Format 1: @[id:nom] -> @nom
  let result = text.replace(/@\[([^:]+):([^\]]+)\]/g, '@$2');
  // Format 2: @[nom](id:uuid) -> @nom
  result = result.replace(/@\[([^\]]+)\]\(id:([^)]+)\)/g, '@$1');
  // Format 3: @[nom](uuid) -> @nom
  result = result.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  
  return result;
};

// Fonction pour rendre les mentions de canaux et d'utilisateurs
export const renderTextWithMentionsAndChannels = (text, themeColors, onUserPress, onChannelPress, textStyle = {}, isOwnMessage = false) => {
  console.log('🔍 renderTextWithMentionsAndChannels called with text:', text);
  
  if (!text || typeof text !== 'string') {
    return <Text style={textStyle}>{text}</Text>;
  }

  // Regex pour détecter les mentions d'utilisateurs et de canaux
  // Mentions utilisateurs: @[id:nom], @[nom](id:uuid), @[nom](uuid)
  const mentionRegex1 = /@\[([^:]+):([^\]]+)\]/g;
  const mentionRegex2 = /@\[([^\]]+)\]\(id:([^)]+)\)/g;
  const mentionRegex3 = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Mentions de canaux: #nom-du-canal (comme dans le frontend)
  const channelRegex = /#([a-zA-Z0-9_-]+)(\s|$)/g;
  
  const parts = [];
  let lastIndex = 0;
  
  // Trouver toutes les mentions et tags dans le texte
  const allTags = [];
  
  // Mentions utilisateurs - Format 1: @[id:nom]
  let match1;
  while ((match1 = mentionRegex1.exec(text)) !== null) {
    allTags.push({
      type: 'user',
      match: match1,
      index: match1.index,
      userId: match1[1],
      userName: match1[2],
      fullMatch: match1[0]
    });
  }
  
  // Mentions utilisateurs - Format 2: @[nom](id:uuid)
  let match2;
  while ((match2 = mentionRegex2.exec(text)) !== null) {
    allTags.push({
      type: 'user',
      match: match2,
      index: match2.index,
      userId: match2[2],
      userName: match2[1],
      fullMatch: match2[0]
    });
  }
  
  // Mentions utilisateurs - Format 3: @[nom](uuid)
  let match3;
  while ((match3 = mentionRegex3.exec(text)) !== null) {
    // Vérifier que ce n'est pas déjà traité par le format 2
    const isAlreadyProcessed = allTags.some(m => m.index === match3.index);
    if (!isAlreadyProcessed) {
      allTags.push({
        type: 'user',
        match: match3,
        index: match3.index,
        userId: match3[2],
        userName: match3[1],
        fullMatch: match3[0]
      });
    }
  }
  
  // Mentions de canaux - Format: #nom-du-canal
  let channelMatch;
  while ((channelMatch = channelRegex.exec(text)) !== null) {
    allTags.push({
      type: 'channel',
      match: channelMatch,
      index: channelMatch.index,
      channelName: channelMatch[1], // Le nom du canal sans le #
      fullMatch: '#' + channelMatch[1] // Juste #nom sans l'espace
    });
  }
  
  // Trier les tags par position dans le texte
  allTags.sort((a, b) => a.index - b.index);
  
  console.log('📝 Found tags:', allTags.length, allTags);

  for (const tag of allTags) {
    // Ajouter le texte avant le tag
    if (tag.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={[textStyle, { color: 'inherit' }]}>
          {text.substring(lastIndex, tag.index)}
        </Text>
      );
    }

    if (tag.type === 'user') {
      // Ajouter la mention d'utilisateur avec style de badge
      const userId = tag.userId;
      const userName = tag.userName;
      
      // Couleurs selon le type de message
      const badgeColors = isOwnMessage 
        ? {
            backgroundColor: '#F3F4F6', // Gris clair pour mes messages
            textColor: '#374151'        // Texte sombre
          }
        : {
            backgroundColor: '#8B5CF6', // Violet pour les autres messages
            textColor: '#FFFFFF'        // Texte blanc
          };
      
      parts.push(
        <View
          key={`mention-wrapper-${tag.index}`}
          style={{
            alignSelf: 'baseline',
            marginHorizontal: 3,
            marginVertical: 0,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: badgeColors.backgroundColor,
              borderRadius: 25,
              paddingHorizontal: 14,
              paddingVertical: 5,
              minWidth: 60,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
            onPress={() => onUserPress && onUserPress(userId, userName)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: badgeColors.textColor,
                fontWeight: '700',
                fontSize: 13,
                textAlign: 'center',
                includeFontPadding: false,
                lineHeight: 13,
              }}
            >
              @{userName}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (tag.type === 'channel') {
      // Ajouter la mention de canal avec style de badge
      const channelName = tag.channelName;
      
      // Couleurs spécifiques pour les canaux
      const channelBadgeColors = {
        backgroundColor: '#3B82F6', // Bleu pour les canaux
        textColor: '#FFFFFF'        // Texte blanc
      };
      
      parts.push(
        <View
          key={`channel-wrapper-${tag.index}`}
          style={{
            alignSelf: 'baseline',
            marginHorizontal: 3,
            marginVertical: 0,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: channelBadgeColors.backgroundColor,
              borderRadius: 25,
              paddingHorizontal: 14,
              paddingVertical: 5,
              minWidth: 60,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
            onPress={() => onChannelPress && onChannelPress(channelName, channelName)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: channelBadgeColors.textColor,
                fontWeight: '700',
                fontSize: 13,
                textAlign: 'center',
                includeFontPadding: false,
                lineHeight: 13,
              }}
            >
              #{channelName}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    lastIndex = tag.index + tag.fullMatch.length;
  }

  // Ajouter le texte restant après le dernier tag
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={[textStyle, { color: 'inherit' }]}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  // Si aucun tag trouvé, retourner le texte normal
  if (parts.length === 0) {
    return <Text style={textStyle}>{text}</Text>;
  }

  // Retourner le texte avec les mentions/canaux stylisés
  return (
    <View style={{ 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      alignItems: 'center',
      marginVertical: 0,
    }}>
      {parts}
    </View>
  );
};

export const stripChannelFormatting = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Le nouveau format est déjà simple (#nom), donc pas besoin de transformation
  // Mais on peut nettoyer les anciens formats si nécessaire
  // Remplacer les anciens formats #[nom](id) par #nom si ils existent encore
  let result = text.replace(/#\[([^\]]+)\]\(([^)]+)\)/g, '#$1');
  
  return result;
};
