export const getStyles = (theme) => ({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    right: 10,
    maxHeight: 240,
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  hashtagIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.accentPrimary,
    marginRight: 8,
  },

  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textPrimary,
    marginLeft: 8,
  },

  suggestionsList: {
    maxHeight: 180,
  },

  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },

  channelItemActive: {
    backgroundColor: theme.accentPrimary + '20',
  },

  channelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accentPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  channelInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  channelName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textPrimary,
    marginBottom: 2,
  },

  channelDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  channelDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    flex: 1,
  },

  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.accentPrimary + '10',
    borderRadius: 12,
  },

  memberCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textSecondary,
    marginLeft: 4,
  },
});
