import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import strawpollService from '../../services/StrawpollService';
import { calculateVotePercentage, truncateText, formatPollDate } from '../../utils/strawpollUtils';

const { width: screenWidth } = Dimensions.get('window');

const StrawpollCard = ({ 
  strawpoll, 
  theme, 
  onViewResults, 
  showPreview = true,
  compact = false 
}) => {
  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showPreview && strawpoll?.pollId) {
      loadPollPreview();
    }
  }, [strawpoll?.pollId, showPreview]);

  const loadPollPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await strawpollService.getPollInfoCached(strawpoll.pollId);
      setPollData(data);
    } catch (err) {
      console.error('Erreur chargement preview sondage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPoll = async () => {
    try {
      const url = strawpoll.url || strawpollService.buildPollUrl(strawpoll.pollId);
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Erreur ouverture sondage:', error);
    }
  };

  const handleViewResults = () => {
    if (onViewResults) {
      onViewResults(strawpoll.pollId);
    }
  };

  const normalizeData = () => {
    if (!pollData || pollData.error) return null;

    try {
      return {
        id: pollData.id,
        title: pollData.title || strawpoll.title || 'Sondage sans titre',
        options: (pollData.poll_options || []).map(option => ({
          text: option.value || option.description || 'Option',
          votes: option.vote_count || 0,
        })),
        created: pollData.created_at,
        totalVotes: (pollData.poll_options || []).reduce((sum, opt) => sum + (opt.vote_count || 0), 0),
      };
    } catch (err) {
      console.error('Erreur normalisation données:', err);
      return null;
    }
  };

  const renderCompactView = () => {
    return (
      <TouchableOpacity style={[styles.compactCard, { backgroundColor: theme.cardBackground }]} onPress={handleOpenPoll}>
        <View style={styles.compactContent}>
          <View style={styles.compactIcon}>
            <Ionicons name="bar-chart" size={16} color={theme.accentPrimary} />
          </View>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {truncateText(strawpoll.title, 30)}
            </Text>
            <Text style={[styles.compactSubtitle, { color: theme.textSecondary }]}>
              Sondage Strawpoll
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderPreviewView = () => {
    const normalizedData = normalizeData();

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="bar-chart" size={20} color={theme.accentPrimary} />
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
              {normalizedData?.title || strawpoll.title || 'Sondage Strawpoll'}
            </Text>
          </View>
          
          {normalizedData?.created && (
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {formatPollDate(normalizedData.created)}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.accentPrimary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Chargement...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#ff6b6b" />
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              Aperçu indisponible
            </Text>
          </View>
        ) : normalizedData ? (
          <View style={styles.previewContainer}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {normalizedData.totalVotes}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Vote{normalizedData.totalVotes !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {normalizedData.options.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Option{normalizedData.options.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {normalizedData.options.length > 0 && (
              <View style={styles.optionsPreview}>
                {normalizedData.options.slice(0, 3).map((option, index) => {
                  const percentage = calculateVotePercentage(option.votes, normalizedData.totalVotes);
                  
                  return (
                    <View key={index} style={styles.optionPreview}>
                      <Text style={[styles.optionText, { color: theme.textPrimary }]} numberOfLines={1}>
                        {truncateText(option.text, 25)}
                      </Text>
                      <Text style={[styles.optionPercentage, { color: theme.textSecondary }]}>
                        {percentage}%
                      </Text>
                    </View>
                  );
                })}
                
                {normalizedData.options.length > 3 && (
                  <Text style={[styles.moreOptions, { color: theme.textSecondary }]}>
                    +{normalizedData.options.length - 3} autre{normalizedData.options.length - 3 !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.basicInfo}>
            <Text style={[styles.basicInfoText, { color: theme.textSecondary }]}>
              Cliquez pour participer au sondage
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accentPrimary }]} onPress={handleOpenPoll}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Voter</Text>
          </TouchableOpacity>
          
          {normalizedData && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.borderColor }]} 
              onPress={handleViewResults}
            >
              <Ionicons name="analytics-outline" size={16} color={theme.textPrimary} />
              <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Résultats</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (compact) {
    return renderCompactView();
  }

  return renderPreviewView();
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    maxWidth: screenWidth * 0.85,
  },
  compactCard: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 22,
  },
  date: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
  },
  previewContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  optionsPreview: {
    gap: 8,
  },
  optionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
  optionPercentage: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  moreOptions: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  basicInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  basicInfoText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default StrawpollCard;