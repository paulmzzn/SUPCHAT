import { StyleSheet } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 8,
    maxHeight: 240,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.accentPrimary + '40',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.accentPrimary + '20',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 8,
  },

  suggestionsList: {
    maxHeight: 180,
  },

  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },

  mentionItemActive: {
    backgroundColor: theme.accentPrimary + '20',
  },

  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    position: 'relative',
  },

  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accentPrimary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },

  botBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.cardBackground,
  },

  mentionInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  mentionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textPrimary,
    marginBottom: 2,
  },

  mentionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  mentionStatusText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});
