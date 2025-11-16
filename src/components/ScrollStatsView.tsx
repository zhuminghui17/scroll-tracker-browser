// ScrollStatsView: Display scroll statistics and analytics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { DomainStats } from '../types/tracking';
import {
  formatDistance,
  formatTime,
  formatNumber,
  formatDistanceForCard,
  formatTimeForCard,
  pixelsToScreenHeights,
} from '../utils/formatters';

interface ScrollStatsViewProps {
  visible: boolean;
  stats: DomainStats[];
  onClose: () => void;
  onRefresh?: () => void; // Callback to request fresh data
}

const ScrollStatsView: React.FC<ScrollStatsViewProps> = ({
  visible,
  stats,
  onClose,
  onRefresh,
}) => {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Auto-refresh stats every 500ms when visible
  useEffect(() => {
    if (!visible || !onRefresh) return;

    // Call immediately when visible
    onRefresh();

    const intervalId = setInterval(() => {
      onRefresh();
    }, 500);

    return () => clearInterval(intervalId);
  }, [visible, onRefresh]);

  // Log when stats change
  useEffect(() => {
    if (visible && stats.length > 0) {
      const totalPixels = stats.reduce((sum, s) => sum + s.scrollMetrics.distancePixels, 0);
      console.log('[ScrollStatsView] Stats updated, total pixels:', totalPixels);
    }
  }, [stats, visible]);

  // Calculate aggregated stats
  const calculateStats = () => {
    let totalDistancePixels = 0;
    let totalTime = 0;
    let totalScrollingTime = 0;

    stats.forEach((domainStat) => {
      totalDistancePixels += domainStat.scrollMetrics.distancePixels;
      totalTime += domainStat.timeMetrics.totalTime;
      totalScrollingTime += domainStat.timeMetrics.scrollingTime;
    });

    // Sort domains by distance
    const sortedDomains = [...stats].sort(
      (a, b) => b.scrollMetrics.distancePixels - a.scrollMetrics.distancePixels
    );

    // Calculate total screen heights from total distance pixels
    const totalScreenHeights = pixelsToScreenHeights(totalDistancePixels);

    return {
      totalDistancePixels,
      totalTime,
      totalScrollingTime,
      totalScreenHeights,
      domainStats: sortedDomains,
      scrollingRatio: totalTime > 0 ? totalScrollingTime / totalTime : 0,
    };
  };

  const aggregatedStats = calculateStats();
  const hasData = stats.length > 0;

  const distanceCard = formatDistanceForCard(aggregatedStats.totalDistancePixels);
  const timeCard = formatTimeForCard(aggregatedStats.totalTime);

  // Find max distance for progress bar scaling
  const maxDistancePixels = Math.max(...aggregatedStats.domainStats.map((d) => d.scrollMetrics.distancePixels), 1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scroll Stats</Text>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!hasData ? (
            // Empty State
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptySubtitle}>
                Start browsing and scrolling to see your statistics
              </Text>
            </View>
          ) : (
            <>
              {/* Summary Cards */}
              <View style={styles.summarySection}>
                <View style={styles.cardRow}>
                  {/* Total Distance */}
                  <View style={[styles.statsCard, styles.cardBlue]}>
                    <Text style={styles.cardLabel}>Distance</Text>
                    <View style={styles.cardValueContainer}>
                      <Text style={styles.cardValue}>{distanceCard.value}</Text>
                      <Text style={styles.cardUnit}>{distanceCard.unit}</Text>
                    </View>
                  </View>

                  {/* Total Time */}
                  <View style={[styles.statsCard, styles.cardGreen]}>
                    <Text style={styles.cardLabel}>Screen Time</Text>
                    <View style={styles.cardValueContainer}>
                      <Text style={styles.cardValue}>{timeCard.value}</Text>
                      <Text style={styles.cardUnit}>{timeCard.unit}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardRow}>
                  {/* Screen Heights */}
                  <View style={[styles.statsCard, styles.cardPurple]}>
                    <Text style={styles.cardLabel}>Screen Heights</Text>
                    <View style={styles.cardValueContainer}>
                      <Text style={styles.cardValue}>
                        {formatNumber(aggregatedStats.totalScreenHeights)}
                      </Text>
                      <Text style={styles.cardUnit}>screens</Text>
                    </View>
                  </View>

                  {/* Scrolling Time */}
                  <View style={[styles.statsCard, styles.cardOrange]}>
                    <Text style={styles.cardLabel}>Scrolling Time</Text>
                    <View style={styles.cardValueContainer}>
                      <Text style={styles.cardValue}>
                        {formatTimeForCard(aggregatedStats.totalScrollingTime).value}
                      </Text>
                      <Text style={styles.cardUnit}>
                        {formatTimeForCard(aggregatedStats.totalScrollingTime).unit}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Top Domains */}
              <View style={styles.domainsSection}>
                <Text style={styles.sectionTitle}>By Domain</Text>
                {aggregatedStats.domainStats.map((domainStat) => {
                  const isExpanded = expandedDomain === domainStat.domain;
                  const progressWidth = (domainStat.scrollMetrics.distancePixels / maxDistancePixels) * 100;

                  return (
                    <TouchableOpacity
                      key={domainStat.domain}
                      style={styles.domainCard}
                      onPress={() =>
                        setExpandedDomain(isExpanded ? null : domainStat.domain)
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.domainHeader}>
                        <View style={styles.domainInfo}>
                          <Text style={styles.domainName}>{domainStat.domain}</Text>
                          <Text style={styles.domainSubtext}>
                            {formatTime(domainStat.timeMetrics.totalTime)}
                          </Text>
                        </View>
                        <Text style={styles.domainDistance}>
                          {formatDistance(domainStat.scrollMetrics.distancePixels)}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${progressWidth}%` },
                          ]}
                        />
                      </View>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <View style={styles.expandedDetails}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Scrolling Time:</Text>
                            <Text style={styles.detailValue}>
                              {formatTime(domainStat.timeMetrics.scrollingTime)}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Screen Time:</Text>
                            <Text style={styles.detailValue}>
                              {formatTime(domainStat.timeMetrics.totalTime)}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Screen Heights:</Text>
                            <Text style={styles.detailValue}>
                              {formatNumber(pixelsToScreenHeights(domainStat.scrollMetrics.distancePixels))}
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 2; // More horizontal padding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.5,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  summarySection: {
    marginBottom: 40,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statsCard: {
    width: cardWidth,
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    padding: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  cardBlue: {
    backgroundColor: '#F0F5FF',
  },
  cardGreen: {
    backgroundColor: '#F0FFF4',
  },
  cardPurple: {
    backgroundColor: '#F9F0FF',
  },
  cardOrange: {
    backgroundColor: '#FFF5F0',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 12,
    opacity: 0.8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  cardValue: {
    fontSize: 40,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -1.5,
  },
  cardUnit: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 4,
    fontWeight: '500',
  },
  domainsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  domainCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  domainIcon: {
    fontSize: 22,
    marginRight: 14,
    opacity: 0.8,
  },
  domainInfo: {
    flex: 1,
  },
  domainName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  domainSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  domainDistance: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
});

export default ScrollStatsView;

