// ScrollStatsView: Display scroll statistics and analytics

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { DomainSession } from '../types/tracking';
import {
  formatDistance,
  formatTime,
  formatPercentage,
  formatNumber,
  formatDistanceForCard,
  formatTimeForCard,
} from '../utils/formatters';

interface DomainStats {
  domain: string;
  totalDistance: number; // meters
  totalTime: number; // ms
  activeTime: number; // ms
  passiveTime: number; // ms
  sessionCount: number;
  screenHeights: number;
}

interface ScrollStatsViewProps {
  visible: boolean;
  sessions: DomainSession[];
  onClose: () => void;
}

const ScrollStatsView: React.FC<ScrollStatsViewProps> = ({
  visible,
  sessions,
  onClose,
}) => {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Calculate aggregated stats
  const calculateStats = () => {
    const domainStatsMap = new Map<string, DomainStats>();
    let totalDistance = 0;
    let totalTime = 0;
    let totalActiveTime = 0;
    let totalPassiveTime = 0;
    let totalScreenHeights = 0;

    sessions.forEach((session) => {
      const distance = session.scrollMetrics.distanceMeters;
      const time = session.timeMetrics.totalTime;
      const active = session.timeMetrics.activeScrollTime;
      const passive = session.timeMetrics.passiveViewTime;
      const heights = session.scrollMetrics.screenHeights;

      totalDistance += distance;
      totalTime += time;
      totalActiveTime += active;
      totalPassiveTime += passive;
      totalScreenHeights += heights;

      if (!domainStatsMap.has(session.domain)) {
        domainStatsMap.set(session.domain, {
          domain: session.domain,
          totalDistance: distance,
          totalTime: time,
          activeTime: active,
          passiveTime: passive,
          sessionCount: 1,
          screenHeights: heights,
        });
      } else {
        const existing = domainStatsMap.get(session.domain)!;
        existing.totalDistance += distance;
        existing.totalTime += time;
        existing.activeTime += active;
        existing.passiveTime += passive;
        existing.sessionCount += 1;
        existing.screenHeights += heights;
      }
    });

    const domainStats = Array.from(domainStatsMap.values()).sort(
      (a, b) => b.totalDistance - a.totalDistance
    );

    return {
      totalDistance,
      totalTime,
      totalActiveTime,
      totalPassiveTime,
      totalScreenHeights,
      domainStats,
      activeRatio: totalTime > 0 ? totalActiveTime / totalTime : 0,
    };
  };

  const stats = calculateStats();
  const hasData = sessions.length > 0;

  const distanceCard = formatDistanceForCard(stats.totalDistance);
  const timeCard = formatTimeForCard(stats.totalTime);

  // Find max distance for progress bar scaling
  const maxDistance = Math.max(...stats.domainStats.map((d) => d.totalDistance), 1);

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
                    <Text style={styles.cardLabel}>Time</Text>
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
                        {formatNumber(stats.totalScreenHeights)}
                      </Text>
                      <Text style={styles.cardUnit}>screens</Text>
                    </View>
                  </View>

                  {/* Active Ratio */}
                  <View style={[styles.statsCard, styles.cardOrange]}>
                    <Text style={styles.cardLabel}>Active Scrolling</Text>
                    <View style={styles.cardValueContainer}>
                      <Text style={styles.cardValue}>
                        {formatPercentage(stats.activeRatio)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Top Domains */}
              <View style={styles.domainsSection}>
                <Text style={styles.sectionTitle}>By Domain</Text>
                {stats.domainStats.map((domainStat) => {
                  const isExpanded = expandedDomain === domainStat.domain;
                  const progressWidth = (domainStat.totalDistance / maxDistance) * 100;

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
                            {formatTime(domainStat.totalTime)} · {domainStat.sessionCount} session{domainStat.sessionCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <Text style={styles.domainDistance}>
                          {formatDistance(domainStat.totalDistance)}
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
                            <Text style={styles.detailLabel}>Active Time:</Text>
                            <Text style={styles.detailValue}>
                              {formatTime(domainStat.activeTime)}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Passive Time:</Text>
                            <Text style={styles.detailValue}>
                              {formatTime(domainStat.passiveTime)}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Screen Heights:</Text>
                            <Text style={styles.detailValue}>
                              {formatNumber(domainStat.screenHeights)}
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

