import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../store/AuthContext';
import { fetchUserProgressLogs, ProgressLog } from '../../api/progressService';
import { SimpleLineChart } from '../../components/SimpleLineChart';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Calendar, DateData } from 'react-native-calendars';

type ProgressScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Progress'>;

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundColor: '#1E2328',
  backgroundGradientFrom: '#1E2328',
  backgroundGradientTo: '#1E2328',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(1, 211, 141, ${opacity})`, // #01D38D
  labelColor: (opacity = 1) => `rgba(160, 165, 177, ${opacity})`, // #A0A5B1
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#01D38D',
  },
};

const calendarTheme = {
  backgroundColor: '#1E2328',
  calendarBackground: '#1E2328',
  textSectionTitleColor: '#A0A5B1',
  textSectionTitleDisabledColor: '#696E79',
  selectedDayBackgroundColor: '#01D38D',
  selectedDayTextColor: '#191E29',
  todayTextColor: '#01D38D',
  dayTextColor: '#FFFFFF',
  textDisabledColor: '#696E79',
  dotColor: '#01D38D',
  selectedDotColor: '#191E29',
  arrowColor: '#01D38D',
  disabledArrowColor: '#696E79',
  monthTextColor: '#FFFFFF',
  indicatorColor: '#01D38D',
  textDayFontWeight: '300' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '500' as const,
  textDayFontSize: 16,
  textMonthFontSize: 20,
  textDayHeaderFontSize: 14,
  'stylesheet.calendar.header': {
    week: {
      marginTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  }
};


const ProgressScreen = () => {
  const navigation = useNavigation<ProgressScreenNavigationProp>();
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!user || !token) return;
    try {
      const response = await fetchUserProgressLogs(token, user._id);
      if (response.success && response.logs) {
        const sortedLogs = response.logs
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
      setIsLoading(true);
      loadLogs();
    }, [loadLogs])
  );
  
  const selectedLog = useMemo(() => {
    if (!selectedDate) return null;
    return logs.find(l => l.date.startsWith(selectedDate)) || null;
  }, [logs, selectedDate]);

  const weightData = useMemo(() => {
    const last30DaysLogs = logs.slice(-30);
    if (last30DaysLogs.length < 2) return null;
    return {
      labels: last30DaysLogs.map(log => {
        const d = new Date(log.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [{ data: last30DaysLogs.map(log => log.weightKg) }],
    };
  }, [logs]);

  const latestStats = useMemo(() => {
    if (logs.length === 0) return null;
    const latest = logs[logs.length-1];
    const previous = logs.length > 1 ? logs[logs.length-2] : null;
    
    const weightDiff = previous ? (latest.weightKg - previous.weightKg) : 0;
    const bodyFatDiff = (previous && latest.bodyFatPercentage && previous.bodyFatPercentage)
      ? (latest.bodyFatPercentage - previous.bodyFatPercentage)
      : null;

    return { latest, weightDiff, bodyFatDiff };
  }, [logs]);

  const markedDates = useMemo(() => {
    const marks: any = {};
    logs.forEach(log => {
      const dateStr = log.date.split('T')[0];
      marks[dateStr] = {
        marked: true,
        dotColor: '#01D38D',
      };
    });
    if (selectedDate) {
        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: '#01D38D',
            selectedTextColor: '#191E29',
        }
    }
    return marks;
  }, [logs, selectedDate]);


  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#01D38D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <Text style={styles.title}>My Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProgressHistory')}>
                <Ionicons name="time-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="analytics-outline" size={80} color="#2A2D32" />
            <Text style={styles.emptyStateText}>No Progress Yet</Text>
            <Text style={styles.emptyStateSubText}>
              Tap the button below to add your first progress log and start your journey.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.quickStatsContainer}>
                <StatCard 
                    icon="barbell-outline"
                    label="Weight"
                    value={`${latestStats?.latest.weightKg || '--'} kg`}
                    change={latestStats?.weightDiff}
                    unit="kg"
                    positiveIsBad={true}
                />
                 <StatCard 
                    icon="body-outline"
                    label="Body Fat"
                    value={`${latestStats?.latest.bodyFatPercentage || '--'}%`}
                    change={latestStats?.bodyFatDiff}
                    unit="%"
                    positiveIsBad={true}
                />
            </View>

            {weightData && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weight Trend</Text>
                    <SimpleLineChart
                        data={weightData}
                        width={width - 74} // container padding + card padding
                        height={220}
                        chartConfig={chartConfig}
                        withHorizontalLabels={true}
                        withVerticalLabels={true}
                        withHorizontalLines={false}
                        withVerticalLines={false}
                    />
                </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Progress Calendar</Text>
              <Calendar
                onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={calendarTheme}
              />
              {selectedLog && (
                <View style={styles.selectedLogContainer}>
                  <Text style={styles.selectedLogDate}>
                    {new Date(selectedLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  <View style={styles.selectedLogDetails}>
                    <View style={styles.logDetailItem}>
                      <Ionicons name="scale-outline" size={20} color="#01D38D" />
                      <Text style={styles.logDetailText}>{selectedLog.weightKg} kg</Text>
                    </View>
                    {selectedLog.bodyFatPercentage && (
                      <View style={styles.logDetailItem}>
                        <Ionicons name="body-outline" size={20} color="#01D38D" />
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
                        <Ionicons name="images-outline" size={20} color="#191E29" />
                        <Text style={styles.viewPhotosText}>View Photos</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('ProgressLogEntry', {})}
      >
        <Ionicons name="add" size={32} color="#191E29" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  change: number | null | undefined;
  unit: string;
  positiveIsBad: boolean;
}

const StatCard = ({icon, label, value, change, unit, positiveIsBad }: StatCardProps) => {
    const isPositive = change ? change > 0 : false;
    const isNegative = change ? change < 0 : false;
    const changeText = change ? `${isPositive ? '+' : ''}${change.toFixed(1)} ${unit}` : `-`;
    
    let changeColor = '#A0A5B1'; // Neutral
    if (isPositive) changeColor = positiveIsBad ? '#FF6B6B' : '#01D38D';
    if (isNegative) changeColor = positiveIsBad ? '#01D38D' : '#FF6B6B';
    
    return (
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
                <Ionicons name={icon} size={24} color="#01D38D" />
            </View>
            <View>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={[styles.statChange, { color: changeColor }]}>
                    {change ? changeText : 'No change'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191E29',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 25,
      paddingTop: 20,
      paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 25,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 20,
    gap: 15
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
  },
  statIconContainer: {
    backgroundColor: '#01D38D20',
    borderRadius: 15,
    padding: 12,
    marginRight: 15,
  },
  statLabel: {
    fontSize: 14,
    color: '#A0A5B1',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    borderRadius: 16,
  },
  selectedLogContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2D32',
  },
  selectedLogDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  selectedLogDetails: {
    gap: 12,
  },
  logDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDetailText: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  viewPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01D38D',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 8,
  },
  viewPhotosText: {
    color: '#191E29',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginHorizontal: 25,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center'
  },
  emptyStateSubText: {
    fontSize: 16,
    color: '#A0A5B1',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#01D38D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#01D38D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default ProgressScreen; 