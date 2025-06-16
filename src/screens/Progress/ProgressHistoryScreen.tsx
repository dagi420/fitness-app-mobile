import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { fetchUserProgressLogs, ProgressLog, deleteProgressLog } from '../../api/progressService';
import { Calendar, DateData } from 'react-native-calendars';
import { API_BASE_URL } from '../../api/apiConfig';
import { Ionicons } from '@expo/vector-icons';

type ProgressHistoryNavigationProp = StackNavigationProp<RootStackParamList, 'ProgressHistory'>;

const calendarTheme = {
  backgroundColor: '#191E29',
  calendarBackground: '#191E29',
  textSectionTitleColor: '#A0A5B1',
  selectedDayBackgroundColor: '#01D38D',
  selectedDayTextColor: '#191E29',
  todayTextColor: '#01D38D',
  dayTextColor: '#FFFFFF',
  textDisabledColor: '#696E79',
  dotColor: '#01D38D',
  selectedDotColor: '#191E29',
  arrowColor: '#01D38D',
  monthTextColor: '#FFFFFF',
  textMonthFontWeight: 'bold' as 'bold',
  textDayHeaderFontWeight: '500' as '500',
};

const ProgressHistoryScreen = () => {
  const navigation = useNavigation<ProgressHistoryNavigationProp>();
  const { user, token } = useAuth();
  const serverRoot = API_BASE_URL.replace('/api', '');

  const [allLogs, setAllLogs] = useState<ProgressLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadProgressLogs = useCallback(async () => {
    if (!user || !token) return;
    setIsLoading(true);
    try {
      const response = await fetchUserProgressLogs(token, user._id);
      if (response.success && response.logs) {
        const sortedLogs = response.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllLogs(sortedLogs);
        // Apply filter if a date is selected, otherwise show all
        if (selectedDate) {
          setFilteredLogs(sortedLogs.filter(log => log.date.startsWith(selectedDate)));
        } else {
          setFilteredLogs(sortedLogs);
        }
      }
    } catch (err) {
      console.error("Error loading progress logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadProgressLogs();
    }, [loadProgressLogs])
  );

  const markedDates = useMemo(() => {
    const marks: { [key: string]: any } = {};
    allLogs.forEach(log => {
      marks[log.date.substring(0, 10)] = { marked: true, dotColor: '#01D38D' };
    });
    if (selectedDate) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#01D38D', selectedTextColor: '#191E29' };
    }
    return marks;
  }, [allLogs, selectedDate]);

  const onDayPress = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(prev => (prev === dateString ? null : dateString));
  };
  
  const handleEditLog = (logId: string) => {
    const logToEdit = allLogs.find(log => log._id === logId);
    navigation.navigate('ProgressLogEntry', { existingLogData: logToEdit });
  };

  const handleDeleteLog = (logId: string) => {
    if (!token) return;
    Alert.alert("Confirm Delete", "Are you sure you want to delete this log?", [
        { text: "Cancel", style: "cancel" },
        {
            text: "Delete", style: "destructive", 
            onPress: async () => {
                const response = await deleteProgressLog(token, logId);
                if (response.success) {
                    Alert.alert("Success", "Log deleted.");
                    loadProgressLogs(); 
                } else {
                    Alert.alert("Error", response.message || "Failed to delete log.");
                }
            }
        }
    ]);
  };
  
  const renderLogItem = ({ item }: { item: ProgressLog }) => (
    <View style={styles.logItemContainer}>
        <View style={styles.logItemHeader}>
            <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            <View style={styles.logActions}>
                <TouchableOpacity onPress={() => handleEditLog(item._id)} style={styles.actionButton}>
                    <Ionicons name="pencil-outline" size={20} color="#A0A5B1" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLog(item._id)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.logDetails}>
            <Text style={styles.logDetailText}>Weight: <Text style={styles.logDetailValue}>{item.weightKg} kg</Text></Text>
            {item.bodyFatPercentage && (
                <Text style={styles.logDetailText}>Body Fat: <Text style={styles.logDetailValue}>{item.bodyFatPercentage}%</Text></Text>
            )}
        </View>
        {item.photoUrls && item.photoUrls.length > 0 && (
             <TouchableOpacity onPress={() => navigation.navigate('PhotoViewer', { photoUrls: item.photoUrls, logDate: item.date })}>
                <Image 
                    source={{ uri: `${serverRoot}${item.photoUrls[0]}` }} 
                    style={styles.thumbnail} 
                />
            </TouchableOpacity>
        )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress History</Text>
        <View style={{width: 24}}/>
      </View>
      
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={calendarTheme}
        style={styles.calendar}
      />

      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContentContainer}
        refreshing={isLoading}
        onRefresh={loadProgressLogs}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="reader-outline" size={60} color="#2A2D32" />
                <Text style={styles.emptyText}>{selectedDate ? `No logs for this day.` : "No history found."}</Text>
                {selectedDate && <Text style={styles.emptySubText}>Select another date or clear the filter.</Text>}
            </View>
        }
      />
       <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('ProgressLogEntry', {})}
      >
        <Ionicons name="add" size={32} color="#191E29" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32'
  },
  backButton: {
      marginRight: 15,
  },
  headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
    paddingBottom: 10,
  },
  listContentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  logItemContainer: {
    backgroundColor: '#1E2328',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logActions: {
      flexDirection: 'row',
      gap: 15,
  },
  actionButton: {
      padding: 5,
  },
  logDetails: {
      marginBottom: 15,
      gap: 8,
  },
  logDetailText: {
    fontSize: 16,
    color: '#A0A5B1',
  },
  logDetailValue: {
      color: '#FFFFFF',
      fontWeight: '600'
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 16,
    color: '#A0A5B1',
    textAlign: 'center',
    marginTop: 10,
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
    elevation: 8,
  },
});

export default ProgressHistoryScreen; 