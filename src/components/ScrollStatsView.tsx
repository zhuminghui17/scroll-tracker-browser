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
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DomainStats, SessionLog } from '../types/tracking';
import DomainStatsTracker from '../trackers/DomainStatsTracker';
import {
  formatDistance,
  formatNumber,
  formatDistanceForCard,
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
  const [viewMode, setViewMode] = useState<'stats' | 'logs'>('stats');
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  // Auto-refresh stats and logs every 500ms when visible
  useEffect(() => {
    if (!visible || !onRefresh) return;

    // Call immediately when visible
    onRefresh();
    refreshLogs();

    const intervalId = setInterval(() => {
      onRefresh();
      refreshLogs();
    }, 500);

    return () => clearInterval(intervalId);
  }, [visible, onRefresh]);

  const refreshLogs = () => {
    const logs = DomainStatsTracker.getInstance().getSessionLogs();
    setSessionLogs(logs);
  };

  // Log when stats change
  useEffect(() => {
    if (visible && stats.length > 0) {
      const totalPixels = stats.reduce((sum, s) => sum + s.scrollMetrics.distancePixels, 0);
      // console.log('[ScrollStatsView] Stats updated, total pixels:', totalPixels);
    }
  }, [stats, visible]);

  const handleExport = async () => {
    try {
      const csv = DomainStatsTracker.getInstance().exportLogsCSV();
      
      if (sessionLogs.length === 0) {
        Alert.alert('No Data', 'There are no session logs to export.');
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `scroll_logs_${timestamp}.csv`;
      
      // Create file in cache directory using new expo-file-system API
      const file = new FileSystem.File(FileSystem.Paths.cache, filename);
      
      // Write CSV content
      await file.write(csv);

      console.log('[ScrollStatsView] CSV file created:', file.uri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the file
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Scroll Logs',
        UTI: 'public.comma-separated-values-text',
      });

      console.log('[ScrollStatsView] CSV file shared successfully');
    } catch (error: any) {
      console.error('[ScrollStatsView] Export error:', error);
      Alert.alert('Error', 'Could not export logs: ' + error.message);
    }
  };

  // Calculate aggregated stats
  const calculateStats = () => {
    let totalDistancePixels = 0;

    stats.forEach((domainStat) => {
      totalDistancePixels += domainStat.scrollMetrics.distancePixels;
    });

    // Sort domains by distance
    const sortedDomains = [...stats].sort(
      (a, b) => b.scrollMetrics.distancePixels - a.scrollMetrics.distancePixels
    );

    // Calculate total screen heights from total distance pixels
    const totalScreenHeights = pixelsToScreenHeights(totalDistancePixels);

    return {
      totalDistancePixels,
      totalScreenHeights,
      domainStats: sortedDomains,
    };
  };

  const aggregatedStats = calculateStats();
  const hasData = stats.length > 0;

  const distanceCard = formatDistanceForCard(aggregatedStats.totalDistancePixels);

  // Find max distance for progress bar scaling
  const maxDistancePixels = Math.max(...aggregatedStats.domainStats.map((d) => d.scrollMetrics.distancePixels), 1);

  const renderStatsView = () => (
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
  );

  const renderLogsView = () => (
    <View style={styles.tableContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}
      >
        <View>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDomain]}>Domain</Text>
            <Text style={[styles.tableHeaderCell, styles.colTime]}>Start</Text>
            <Text style={[styles.tableHeaderCell, styles.colTime]}>End</Text>
            <Text style={[styles.tableHeaderCell, styles.colMetric]}>Distance</Text>
          </View>
          
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {sessionLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No logs yet</Text>
              </View>
            ) : (
              sessionLogs.map((log, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDomain]} numberOfLines={1}>
                    {log.domain}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTime]}>
                    {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTime]}>
                    {new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </Text>
                  <Text style={[styles.tableCell, styles.colMetric]}>
                    {formatDistance(log.scrollDistance)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );

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
          <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'stats' && styles.toggleButtonActive]}
              onPress={() => setViewMode('stats')}
            >
              <Text style={[styles.toggleText, viewMode === 'stats' && styles.toggleTextActive]}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'logs' && styles.toggleButtonActive]}
              onPress={() => setViewMode('logs')}
            >
              <Text style={[styles.toggleText, viewMode === 'logs' && styles.toggleTextActive]}>Logs</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'stats' ? renderStatsView() : renderLogsView()}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  doneButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  exportButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exportButtonText: {
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
  // Logs styles
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 13,
    color: '#000000',
  },
  colDomain: {
    width: 120,
    paddingRight: 8,
  },
  colTime: {
    width: 80,
  },
  colMetric: {
    width: 80,
    textAlign: 'right',
  },
});

export default ScrollStatsView;
