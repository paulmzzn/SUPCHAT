import { StyleSheet } from 'react-native';

export const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primaryBackground,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: themeColors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderColor,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  backButton: {
    padding: 8,
    marginRight: 8,
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.textPrimary,
  },

  headerSubtitle: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginTop: 2,
  },

  createButton: {
    backgroundColor: themeColors.accentPrimary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  content: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  loadingText: {
    fontSize: 16,
    color: themeColors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },

  listContainer: {
    padding: 16,
  },

  reminderItem: {
    backgroundColor: themeColors.secondaryBackground,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: themeColors.borderColor,
  },

  expiredReminder: {
    backgroundColor: themeColors.error + '10',
    borderColor: themeColors.error + '30',
  },

  reminderContent: {
    padding: 16,
  },

  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.textPrimary,
    flex: 1,
    marginRight: 12,
  },

  expiredText: {
    color: themeColors.error,
  },

  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: themeColors.borderColor + '30',
  },

  reminderDescription: {
    fontSize: 14,
    color: themeColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },

  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  reminderDate: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginLeft: 6,
  },

  recurringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.accentPrimary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  recurringText: {
    fontSize: 12,
    color: themeColors.accentPrimary,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: themeColors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  emptyActionButton: {
    backgroundColor: themeColors.accentPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
