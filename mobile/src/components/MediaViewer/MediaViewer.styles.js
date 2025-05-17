import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 40, // Extra padding for status bar
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 80, // Space for footer
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    paddingBottom: 30, // Extra padding for safe area
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    margin: 5,
  },
  downloadButton: {
    backgroundColor: '#4285F4',
  },
  cancelButton: {
    backgroundColor: '#616161',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Media type specific styles
  mediaContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  touchToZoom: {
    color: '#DDDDDD',
    fontSize: 14,
    marginTop: 10,
  },
  pdfContainer: {
    width: '100%',
    height: height * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfView: {
    flex: 1,
    width: width * 0.9,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  videoContainer: {
    width: '100%',
    height: height * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  videoPlayer: {
    width: width * 0.9,
    height: width * 0.9 * (9/16), // 16:9 aspect ratio
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  videoFullscreenPlayer: {
    width: '100%',
    height: '100%',
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 20,
    zIndex: 1001,
  },
  audioContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  audioPlayer: {
    width: width * 0.8,
    height: 80,
    marginTop: 20,
  },
  genericContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    width: '100%',
  },
  mediaTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  mediaType: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 20,
  },
  openInBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  
  // State styles
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
});
