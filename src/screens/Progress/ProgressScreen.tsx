import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../store/AuthContext';
import { fetchUserProgressLogs, ProgressLog } from '../../api/progressService';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { Calendar, DateData } from 'react-native-calendars';
import { API_BASE_URL } from '../../api/apiConfig';

type ProgressScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Progress'>;

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const navigation = useNavigation<ProgressScreenNavigationProp>();
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ProgressLog | null>(null);
  const serverRoot = API_BASE_URL.replace('/api', '');

  const loadLogs = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      const response = await fetchUserProgressLogs(token, user._id);
      if (response.success && response.logs) {
        const sortedLogs = response.logs
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLogs(sortedLogs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  const getWeightData = () => {
    const data = logs
      .slice(0, 7)
      .reverse()
      .map(log => log.weightKg);
    return {
      labels: Array(data.length).fill(''),
      datasets: [{ data }],
    };
  };

  const getLatestStats = () => {
    if (logs.length === 0) return null;
    const latest = logs[0];
    const previous = logs[1];
    
    const weightDiff = previous 
      ? (latest.weightKg - previous.weightKg).toFixed(1)
      : '0';
    
    const bodyFatDiff = (previous && latest.bodyFatPercentage && previous.bodyFatPercentage)
      ? (latest.bodyFatPercentage - previous.bodyFatPercentage).toFixed(1)
      : null;

    return { latest, weightDiff, bodyFatDiff };
  };

  const getMarkedDates = () => {
    const markedDates: any = {};
    logs.forEach(log => {
      const dateStr = log.date.split('T')[0];
      const hasPhotos = log.photoUrls && log.photoUrls.length > 0;
      
      markedDates[dateStr] = {
        marked: true,
        dotColor: hasPhotos ? '#34C759' : '#007AFF',
        selected: dateStr === selectedDate,
        selectedColor: '#007AFF',
      };
    });
    return markedDates;
  };

  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;
    const log = logs.find(l => l.date.startsWith(dateStr));
    
    setSelectedDate(dateStr);
    setSelectedLog(log || null);
  };

  const renderQuickStats = () => {
    const stats = getLatestStats();
    if (!stats) return null;

    return (
      <View style={styles.quickStatsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Weight</Text>
          <Text style={styles.statValue}>{stats.latest.weightKg} kg</Text>
          <Text style={[styles.statChange, 
            parseFloat(stats.weightDiff) < 0 
              ? styles.decreaseText 
              : parseFloat(stats.weightDiff) > 0 
                ? styles.increaseText 
                : styles.neutralText
          ]}>
            {parseFloat(stats.weightDiff) > 0 ? '+' : ''}{stats.weightDiff} kg
          </Text>
        </View>

        {stats.latest.bodyFatPercentage && (
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Body Fat</Text>
            <Text style={styles.statValue}>{stats.latest.bodyFatPercentage}%</Text>
            {stats.bodyFatDiff && (
              <Text style={[styles.statChange,
                parseFloat(stats.bodyFatDiff) < 0 
                  ? styles.decreaseText 
                  : parseFloat(stats.bodyFatDiff) > 0 
                    ? styles.increaseText 
                    : styles.neutralText
              ]}>
                {parseFloat(stats.bodyFatDiff) > 0 ? '+' : ''}{stats.bodyFatDiff}%
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCalendarCard = () => (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>Progress Calendar</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.legendText}>Log</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.legendText}>Photos</Text>
          </View>
        </View>
      </View>
      
      <Calendar
        onDayPress={handleDayPress}
        markedDates={getMarkedDates()}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#007AFF',
          dayTextColor: '#2c2c2c',
          textDisabledColor: '#d9e1e8',
          dotColor: '#007AFF',
          selectedDotColor: '#ffffff',
          arrowColor: '#007AFF',
          monthTextColor: '#2d4150',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
      />

      {selectedLog && (
        <View style={styles.selectedLogContainer}>
          <Text style={styles.selectedLogDate}>
            {new Date(selectedLog.date).toLocaleDateString()}
          </Text>
          <View style={styles.selectedLogDetails}>
            <View style={styles.logDetailItem}>
              <Icon name="scale" size={20} color="#007AFF" />
              <Text style={styles.logDetailText}>{selectedLog.weightKg} kg</Text>
            </View>
            {selectedLog.bodyFatPercentage && (
              <View style={styles.logDetailItem}>
                <Icon name="percent" size={20} color="#007AFF" />
                <Text style={styles.logDetailText}>{selectedLog.bodyFatPercentage}% body fat</Text>
              </View>
            )}
            {selectedLog.photoUrls && selectedLog.photoUrls.length > 0 && (
              <TouchableOpacity 
                style={styles.viewPhotosButton}
                onPress={() => navigation.navigate('PhotoViewer', { 
                  photoUrls: selectedLog.photoUrls || [],
                  logDate: selectedLog.date
                })}
              >
                <Icon name="image-multiple" size={20} color="#ffffff" />
                <Text style={styles.viewPhotosText}>View Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => {
    const allPhotoUrls = logs
      .flatMap(log => log.photoUrls || [])
      .filter(url => !!url);

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ProgressLogEntry', {})}
        >
          <Icon name="plus-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>New Log</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ProgressHistory')}
        >
          <Icon name="history" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('PhotoViewer', { photoUrls: allPhotoUrls })}
        >
          <Icon name="image-multiple" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Photos</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>My Progress</Text>
      
      {renderQuickStats()}
      {renderActionButtons()}
      {renderCalendarCard()}

      {logs.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Weight Trend</Text>
          <LineChart
            data={getWeightData()}
            width={width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {logs.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Icon name="scale-bathroom" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No progress logs yet</Text>
          <Text style={styles.emptyStateSubText}>
            Start tracking your fitness journey by adding your first log!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  decreaseText: {
    color: '#34C759',
  },
  increaseText: {
    color: '#FF3B30',
  },
  neutralText: {
    color: '#8E8E93',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#007AFF',
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  selectedLogContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectedLogDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  selectedLogDetails: {
    gap: 8,
  },
  logDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logDetailText: {
    fontSize: 14,
    color: '#666',
  },
  viewPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  viewPhotosText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProgressScreen; 