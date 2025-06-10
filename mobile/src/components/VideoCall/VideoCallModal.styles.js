import { StyleSheet, Dimensions } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  
  modalBackdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    width: '95%',
    height: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  
  headerTitleContainer: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  
  participantsCount: {
    fontSize: 14,
    marginLeft: 6,
  },
  
  closeButton: {
    padding: 4,
  },
  
  // Content
  content: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  
  bypassButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  
  errorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  
  controlButtonOff: {
    backgroundColor: 'red',
  },
  
  browserButton: {
    marginLeft: 'auto',
  },
  
  endCallButton: {
    borderRadius: 25,
    paddingHorizontal: 16,
    width: 100,
  },
  
  endCallText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  }
});
