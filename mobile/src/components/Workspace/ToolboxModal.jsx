import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const ToolboxModal = memo(({ 
  visible, 
  onClose, 
  styles, 
  themeColors,
  onCreateStrawpoll,
  onCreateReminder,
  onOpenGoogleDrive,
  onImportFromGoogleDrive 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.toolboxModal}>
          <View style={styles.toolboxHeader}>
            <Text style={styles.toolboxTitle}>Boîte à outils</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.toolboxCloseButton}
            >
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.toolboxContent}>
            {/* Section Sondages */}
            <Text style={styles.toolboxSectionTitle}>Sondages</Text>
            <TouchableOpacity 
              style={styles.toolboxOption}
              onPress={onCreateStrawpoll}
            >
              <View style={styles.toolboxOptionIcon}>
                <Ionicons name="bar-chart-outline" size={24} color={themeColors.accentPrimary} />
              </View>
              <View style={styles.toolboxOptionContent}>
                <Text style={styles.toolboxOptionTitle}>Créer un Strawpoll</Text>
                <Text style={styles.toolboxOptionDescription}>
                  Créer un sondage pour recueillir l'avis des membres
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            {/* Section Rappels */}
            <Text style={styles.toolboxSectionTitle}>Rappels</Text>
            <TouchableOpacity 
              style={styles.toolboxOption}
              onPress={onCreateReminder}
            >
              <View style={styles.toolboxOptionIcon}>
                <Ionicons name="alarm-outline" size={24} color={themeColors.accentPrimary} />
              </View>
              <View style={styles.toolboxOptionContent}>
                <Text style={styles.toolboxOptionTitle}>Créer un rappel</Text>
                <Text style={styles.toolboxOptionDescription}>
                  Programmer un rappel pour l'équipe ou pour vous-même
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            {/* Section Google Drive */}
            <Text style={styles.toolboxSectionTitle}>Google Drive</Text>
            <TouchableOpacity 
              style={styles.toolboxOption}
              onPress={onOpenGoogleDrive}
            >
              <View style={styles.toolboxOptionIcon}>
                <Ionicons name="cloud-outline" size={24} color={themeColors.accentPrimary} />
              </View>
              <View style={styles.toolboxOptionContent}>
                <Text style={styles.toolboxOptionTitle}>Ouvrir Google Drive</Text>
                <Text style={styles.toolboxOptionDescription}>
                  Accéder à vos fichiers sur Google Drive
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolboxOption}
              onPress={onImportFromGoogleDrive}
            >
              <View style={styles.toolboxOptionIcon}>
                <Ionicons name="cloud-download-outline" size={24} color={themeColors.accentPrimary} />
              </View>
              <View style={styles.toolboxOptionContent}>
                <Text style={styles.toolboxOptionTitle}>Importer depuis Google Drive</Text>
                <Text style={styles.toolboxOptionDescription}>
                  Importer des fichiers directement depuis Google Drive
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

ToolboxModal.displayName = 'ToolboxModal';

export default ToolboxModal;
