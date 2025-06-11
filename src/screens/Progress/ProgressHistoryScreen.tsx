import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types'; // Adjust if needed
import { useAuth } from '../../store/AuthContext';
import { fetchUserProgressLogs, ProgressLog, deleteProgressLog } from '../../api/progressService';
import { Calendar, DateData } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { API_BASE_URL } from '../../api/apiConfig'; // Import API_BASE_URL

// Ensure 'ProgressHistory' is in RootStackParamList, taking no params for now
type ProgressHistoryNavigationProp = StackNavigationProp<RootStackParamList, 'ProgressHistory'>;

const ProgressHistoryScreen = () => {
  const navigation = useNavigation<ProgressHistoryNavigationProp>();
  const { user, token } = useAuth();
  const serverRoot = API_BASE_URL.replace('/api', '');

  const [allLogs, setAllLogs] = useState<ProgressLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const navigateToPhotoViewer = (photos: string[], date?: string) => {
    if (photos && photos.length > 0) {
      navigation.navigate('PhotoViewer', { photoUrls: photos, logDate: date });
    }
  };

  const loadProgressLogs = useCallback(async () => {
    if (!user || !token) {
      setError('User not authenticated.');
      setAllLogs([]);
      setFilteredLogs([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchUserProgressLogs(token, user._id);
      if (response.success && response.logs) {
        const sortedLogs = response.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllLogs(sortedLogs);
        setFilteredLogs(selectedDate ? sortedLogs.filter(log => log.date.startsWith(selectedDate)) : sortedLogs);
      } else {
        setError(response.message || 'Failed to fetch progress logs.');
        setAllLogs([]);
        setFilteredLogs([]);
      }
    } catch (err) {
      console.error("Error loading progress logs:", err);
      setError('An unexpected error occurred while fetching logs.');
      setAllLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, token, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadProgressLogs();
    }, [loadProgressLogs])
  );

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    allLogs.forEach(log => {
      const dateString = log.date.substring(0, 10);
      marks[dateString] = { marked: true, dotColor: '#007AFF' };
    });
    if (selectedDate) {
        marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: '#007AFF' };
    }
    return marks;
  }, [allLogs, selectedDate]);

  const onDayPress = (day: DateData) => {
    const dateString = day.dateString;
    if (selectedDate === dateString) {
      setSelectedDate(null);
      setFilteredLogs(allLogs); 
    } else {
      setSelectedDate(dateString);
      setFilteredLogs(allLogs.filter(log => log.date.startsWith(dateString)));
    }
  };

  const handleAddNewLog = () => {
    navigation.navigate('ProgressLogEntry', { 
        // onLogSaved: () => { // Removed
        //     setSelectedDate(null); // This logic can be handled by useFocusEffect or if ProgressLogEntry modifies a shared state
        //     loadProgressLogs();
        // }
    });
  };

  const handleEditLog = (logId: string) => {
    const logToEdit = allLogs.find(log => log._id === logId);
    navigation.navigate('ProgressLogEntry', { 
        existingLogData: logToEdit, // Pass the full log data for pre-filling the form
        // onLogSaved: () => { // Removed
        //     loadProgressLogs(); 
        // }
    });
  };

  const handleDeleteLog = async (logId: string) => {
    if (!token) {
        Alert.alert("Error", "Authentication token not found.");
        return;
    }
    Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this log? This action cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    setIsLoading(true);
                    try {
                        const response = await deleteProgressLog(token, logId);
                        if (response.success) {
                            Alert.alert("Success", "Log deleted successfully.");
                            loadProgressLogs(); 
                        } else {
                            Alert.alert("Error", response.message || "Failed to delete log.");
                        }
                    } catch (err) {
                        console.error("Error deleting log:", err);
                        Alert.alert("Error", "An unexpected error occurred.");
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        ]
    );
  };

  const renderLogItem = ({ item }: { item: ProgressLog }) => (
    <View style={styles.logItemContainer}>
        <TouchableOpacity onPress={() => handleEditLog(item._id)} style={styles.logContent}>
            <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.logDetail}>Weight: {item.weightKg} kg</Text>
            {item.bodyFatPercentage && (
                <Text style={styles.logDetail}>Body Fat: {item.bodyFatPercentage}%</Text>
            )}
            {item.photoUrls && item.photoUrls.length > 0 && (
                <TouchableOpacity onPress={() => navigateToPhotoViewer(item.photoUrls || [], item.date)}>
                    <Image 
                        source={{ uri: `${serverRoot}${item.photoUrls[0]}` }} 
                        style={styles.thumbnail} 
                        onError={(e) => console.log("Error loading image:", e.nativeEvent.error, `${serverRoot}${item.photoUrls && item.photoUrls[0]}`)}
                    />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteLog(item._id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
    </View>
  );

  if (isLoading && allLogs.length === 0) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading progress...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={loadProgressLogs} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        markingType={'dot'}
        theme={{
            calendarBackground: styles.safeArea.backgroundColor,
            arrowColor: '#007AFF',
            todayTextColor: '#FF3B30',
            selectedDayBackgroundColor: '#007AFF',
            selectedDayTextColor: '#ffffff',
            dotColor: '#007AFF',
        }}
        style={styles.calendar}
      />
      {filteredLogs.length === 0 && !isLoading ? (
          <View style={styles.centeredContainerEmptyList}>
            <Text style={styles.emptyText}>{selectedDate ? `No logs for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString()}.` : "No progress logs found."}</Text>
            {!selectedDate && <Text style={styles.emptySubText}>Start by adding your first log!</Text>}
            {selectedDate && <Button title="Show All Logs" onPress={() => {setSelectedDate(null); setFilteredLogs(allLogs);}} />}
          </View>
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContentContainer}
          refreshing={isLoading}
          onRefresh={loadProgressLogs}
        />
      )}
      <View style={styles.addButtonContainer}>
        <Button title="Add New Progress Log" onPress={handleAddNewLog} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredContainerEmptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContentContainer: {
    padding: 10,
    flexGrow: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  logItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logContent: {
    flex: 1, 
  },
  logDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  logDetail: {
    fontSize: 15,
    color: '#555',
    marginBottom: 3,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  addButtonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
});

export default ProgressHistoryScreen; 