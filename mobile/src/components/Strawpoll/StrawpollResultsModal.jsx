import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import strawpollService from '../../services/StrawpollService';

const { width: screenWidth } = Dimensions.get('window');

const StrawpollResultsModal = ({ visible, pollId, onClose, theme }) => {
  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    if (visible && pollId) {
      loadPollResults();
    }
  }, [visible, pollId]);

  const loadPollResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await strawpollService.getPollInfo(pollId);
      setPollData(data);
    } catch (err) {
      console.error('Erreur chargement résultats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPollExternal = async () => {
    try {
      const url = strawpollService.buildPollUrl(pollId);
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Erreur ouverture sondage:', error);
    }
  };

  const normalizeData = () => {
    if (!pollData || pollData.error) return null;

    try {
      return {
        id: pollData.id,
        title: pollData.title || 'Sondage sans titre',
        options: (pollData.poll_options || []).map(option => ({
          text: option.value || option.description || 'Option',
          votes: option.vote_count || 0,
        })),
        created: pollData.created_at,
        url: pollData.url || strawpollService.buildPollUrl(pollId),
      };
    } catch (err) {
      console.error('Erreur normalisation données:', err);
      return null;
    }
  };

  const normalizedData = normalizeData();
  const totalVotes = normalizedData?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  const renderResults = () => {
    if (!normalizedData) return null;

    return (
      <View style={styles.resultsContainer}>
        {normalizedData.options.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          
          return (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={[styles.optionText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {option.text}
                </Text>
                <View style={styles.voteInfo}>
                  <Text style={[styles.voteCount, { color: theme.textPrimary }]}>
                    {option.votes}
                  </Text>
                  <Text style={[styles.percentage, { color: theme.textSecondary }]}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              
              <View style={[styles.progressBarContainer, { backgroundColor: theme.borderColor }]}>
                <View 
                  style={[
                    styles.progressBar,
                    { 
                      backgroundColor: theme.accentPrimary,
                      width: `${percentage}%`
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderStats = () => {
    if (!normalizedData) return null;

    const maxVotes = Math.max(...normalizedData.options.map(o => o.votes));
    const winners = normalizedData.options.filter(o => o.votes === maxVotes);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {totalVotes}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Votes totaux
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {normalizedData.options.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Options
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {normalizedData.created 
                ? new Date(normalizedData.created * 1000).toLocaleDateString('fr-FR')
                : '–'
              }
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Créé le
            </Text>
          </View>
        </View>

        <View style={styles.winnerSection}>
          <Text style={[styles.winnerTitle, { color: theme.textPrimary }]}>
            Option en tête
          </Text>
          
          {maxVotes === 0 ? (
            <Text style={[styles.noVotes, { color: theme.textSecondary }]}>
              Aucun vote
            </Text>
          ) : winners.length === 1 ? (
            <View style={styles.winner}>
              <Text style={[styles.winnerText, { color: theme.accentPrimary }]}>
                {winners[0].text}
              </Text>
              <Text style={[styles.winnerVotes, { color: theme.textSecondary }]}>
                {winners[0].votes} vote{winners[0].votes !== 1 ? 's' : ''} 
                ({totalVotes > 0 ? Math.round((winners[0].votes / totalVotes) * 100) : 0}%)
              </Text>
            </View>
          ) : (
            <View style={styles.tie}>
              <Text style={[styles.tieText, { color: theme.textPrimary }]}>
                Égalité entre {winners.length} options
              </Text>
              <Text style={[styles.tieVotes, { color: theme.textSecondary }]}>
                {maxVotes} vote{maxVotes !== 1 ? 's' : ''} chacune
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="bar-chart" size={24} color={theme.accentPrimary} />
            <Text style={styles.title} numberOfLines={2}>
              {loading ? 'Chargement...' : 
               error ? 'Erreur' : 
               normalizedData?.title || 'Résultats du sondage'}
            </Text>
          </View>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
          >
            <Ionicons 
              name="bar-chart-outline" 
              size={16} 
              color={activeTab === 'results' ? theme.accentPrimary : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'results' ? theme.accentPrimary : theme.textSecondary }
            ]}>
              Résultats
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Ionicons 
              name="analytics-outline" 
              size={16} 
              color={activeTab === 'stats' ? theme.accentPrimary : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'stats' ? theme.accentPrimary : theme.textSecondary }
            ]}>
              Statistiques
            </Text>
          </TouchableOpacity>
          
          {normalizedData && (
            <TouchableOpacity
              style={styles.externalLink}
              onPress={handleOpenPollExternal}
            >
              <Ionicons name="open-outline" size={16} color={theme.accentPrimary} />
              <Text style={[styles.tabText, { color: theme.accentPrimary }]}>
                Voir sur Strawpoll
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accentPrimary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Chargement des résultats...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={48} color="#ff6b6b" />
              <Text style={[styles.errorText, { color: theme.textPrimary }]}>
                Erreur de chargement
              </Text>
              <Text style={[styles.errorDetails, { color: theme.textSecondary }]}>
                {error}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadPollResults}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : !normalizedData ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
              <Text style={[styles.errorText, { color: theme.textPrimary }]}>
                Données invalides
              </Text>
              <Text style={[styles.errorDetails, { color: theme.textSecondary }]}>
                Impossible d'afficher les résultats du sondage
              </Text>
            </View>
          ) : activeTab === 'results' ? (
            renderResults()
          ) : (
            renderStats()
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const getStyles = (theme) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: theme.accentPrimary + '20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.accentPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    paddingBottom: 20,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  voteInfo: {
    alignItems: 'flex-end',
  },
  voteCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  percentage: {
    fontSize: 14,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: theme.cardBackground,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  winnerSection: {
    backgroundColor: theme.cardBackground,
    padding: 20,
    borderRadius: 12,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  winner: {
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  winnerVotes: {
    fontSize: 14,
  },
  tie: {
    alignItems: 'center',
  },
  tieText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  tieVotes: {
    fontSize: 14,
  },
  noVotes: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default StrawpollResultsModal;