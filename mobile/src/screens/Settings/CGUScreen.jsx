import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';

const CGUScreen = () => {
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();

  const styles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.primaryBackground,
    },
    header: {
      backgroundColor: themeColors.cardBackground,
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderColor,
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    contentContainer: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.textPrimary,
      marginBottom: 10,
      textAlign: 'center',
    },
    lastUpdate: {
      fontSize: 12,
      color: themeColors.textMuted,
      textAlign: 'center',
      marginBottom: 20,
      fontStyle: 'italic',
    },
    intro: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginTop: 20,
      marginBottom: 10,
    },
    paragraph: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginBottom: 15,
    },
    listItem: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginLeft: 10,
      marginBottom: 5,
    },
    link: {
      color: themeColors.accentPrimary,
      textDecorationLine: 'underline',
    },
    footer: {
      backgroundColor: themeColors.cardBackground,
      padding: 20,
      marginTop: 20,
      borderRadius: 10,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    footerText: {
      fontSize: 12,
      color: themeColors.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:contact@supchat.fr');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions Générales d'Utilisation</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Conditions Générales d'Utilisation (CGU)</Text>
          <Text style={styles.lastUpdate}>Dernière mise à jour : Mai 2025</Text>
          
          <Text style={styles.intro}>
            Bienvenue sur SUPCHAT. L'utilisation de notre service implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation.
          </Text>
          
          <Text style={styles.sectionTitle}>1. Objet</Text>
          <Text style={styles.paragraph}>
            SUPCHAT permet aux utilisateurs de communiquer, collaborer et partager des informations dans un cadre professionnel ou académique. Toute utilisation doit respecter la législation en vigueur et les règles de bonne conduite. La plateforme propose des fonctionnalités de messagerie instantanée, de partage de fichiers et de création d'espaces de travail collaboratifs.
          </Text>

          <Text style={styles.sectionTitle}>2. Données personnelles et RGPD</Text>
          <Text style={styles.paragraph}>
            Conformément au Règlement Général sur la Protection des Données (RGPD), nous nous engageons à :
          </Text>
          <Text style={styles.listItem}>• Collecter uniquement les données nécessaires au fonctionnement du service</Text>
          <Text style={styles.listItem}>• Ne pas revendre vos informations personnelles à des tiers</Text>
          <Text style={styles.listItem}>• Vous permettre d'accéder à vos données, de les modifier ou de les supprimer</Text>
          <Text style={styles.listItem}>• Vous garantir la possibilité d'exporter l'intégralité de vos données via l'onglet sécurité</Text>
          <Text style={styles.listItem}>• Sécuriser vos données selon les standards de l'industrie</Text>
          
          <Text style={styles.paragraph}>
            Pour exercer vos droits ou pour toute question relative à la protection de vos données, vous pouvez contacter notre délégué à la protection des données à l'adresse : noreply@supchat.fr
          </Text>

          <Text style={styles.sectionTitle}>3. Sécurité et confidentialité</Text>
          <Text style={styles.paragraph}>
            SUPCHAT met en œuvre des mesures techniques et organisationnelles pour protéger vos données, notamment :
          </Text>
          <Text style={styles.listItem}>• Le chiffrement des communications</Text>
          <Text style={styles.listItem}>• L'authentification à deux facteurs (disponible dans les paramètres de sécurité)</Text>
          
          <Text style={styles.paragraph}>
            En tant qu'utilisateur, vous êtes responsable de la confidentialité de votre mot de passe et de vos informations de connexion. Nous vous recommandons de :
          </Text>
          <Text style={styles.listItem}>• Utiliser un mot de passe unique et complexe</Text>
          <Text style={styles.listItem}>• Ne jamais partager vos identifiants</Text>
          <Text style={styles.listItem}>• Vous déconnecter après chaque session sur un appareil partagé</Text>

          <Text style={styles.sectionTitle}>4. Comportement des utilisateurs</Text>
          <Text style={styles.paragraph}>
            Lors de l'utilisation de SUPCHAT, il est strictement interdit de :
          </Text>
          <Text style={styles.listItem}>• Publier des contenus illicites, offensants, diffamatoires ou discriminatoires</Text>
          <Text style={styles.listItem}>• Harceler d'autres utilisateurs ou adopter un comportement malveillant</Text>
          <Text style={styles.listItem}>• Tenter de compromettre la sécurité de la plateforme</Text>
          <Text style={styles.listItem}>• Utiliser le service pour envoyer des messages non sollicités (spam)</Text>
          <Text style={styles.listItem}>• Usurper l'identité d'un autre utilisateur ou créer de faux comptes</Text>
          
          <Text style={styles.paragraph}>
            SUPCHAT se réserve le droit de suspendre ou supprimer, sans préavis, tout compte ne respectant pas ces règles. Des poursuites judiciaires pourront être engagées en cas d'infractions graves.
          </Text>

          <Text style={styles.sectionTitle}>5. Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            Les contenus publiés sur SUPCHAT restent la propriété de leurs auteurs. En partageant du contenu, vous :
          </Text>
          <Text style={styles.listItem}>• Garantissez disposer des droits nécessaires sur ce contenu</Text>
          <Text style={styles.listItem}>• Accordez à SUPCHAT une licence non-exclusive pour héberger et afficher ce contenu</Text>
          <Text style={styles.listItem}>• Acceptez que votre contenu puisse être visible par d'autres membres selon les paramètres de confidentialité que vous avez définis</Text>
          
          <Text style={styles.paragraph}>
            L'interface, les logos et la marque SUPCHAT sont protégés par le droit d'auteur et ne peuvent être utilisés sans autorisation préalable.
          </Text>

          <Text style={styles.sectionTitle}>6. Espaces de travail et canaux</Text>
          <Text style={styles.paragraph}>
            Les administrateurs d'espaces de travail sont responsables de :
          </Text>
          <Text style={styles.listItem}>• La modération des contenus publiés dans leur espace</Text>
          <Text style={styles.listItem}>• La gestion des membres et de leurs permissions</Text>
          <Text style={styles.listItem}>• Le respect des présentes CGU au sein de leur espace</Text>
          
          <Text style={styles.paragraph}>
            SUPCHAT se réserve le droit d'intervenir dans un espace de travail en cas de signalement ou de violation manifeste des CGU.
          </Text>

          <Text style={styles.sectionTitle}>7. Modifications et résiliation</Text>
          <Text style={styles.paragraph}>
            SUPCHAT se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications majeures par email ou notification dans l'application. La continuation de l'utilisation du service après ces modifications vaut acceptation des nouvelles conditions.
          </Text>
          <Text style={styles.paragraph}>
            Vous pouvez résilier votre compte à tout moment depuis l'onglet Sécurité des paramètres. La suppression de votre compte entraînera la suppression de vos données personnelles conformément à notre politique de rétention.
          </Text>

          <Text style={styles.sectionTitle}>8. Droit applicable et juridiction</Text>
          <Text style={styles.paragraph}>
            Les présentes CGU sont régies par le droit français. Tout litige relatif à l'interprétation ou l'exécution des présentes sera soumis aux tribunaux compétents.
          </Text>

          <Text style={styles.sectionTitle}>9. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question relative aux CGU ou à vos données personnelles, contactez l'administrateur du service à{' '}
            <Text style={styles.link} onPress={handleEmailPress}>
              contact@supchat.fr
            </Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En utilisant SUPCHAT, vous reconnaissez avoir lu, compris et accepté les présentes Conditions Générales d'Utilisation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default CGUScreen;
