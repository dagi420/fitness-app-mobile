import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({
  visible,
  onClose,
  applyFilters,
  initialFilters,
  equipmentList,
  muscleGroups,
  difficulties,
}) => {
  const [muscleGroup, setMuscleGroup] = useState(initialFilters.muscleGroup);
  const [difficulty, setDifficulty] = useState(initialFilters.difficulty);
  const [equipment, setEquipment] = useState(initialFilters.equipment);

  useEffect(() => {
    setMuscleGroup(initialFilters.muscleGroup);
    setDifficulty(initialFilters.difficulty);
    setEquipment(initialFilters.equipment);
  }, [initialFilters]);

  const handleApply = () => {
    applyFilters({ muscleGroup, difficulty, equipment });
    onClose();
  };
  
  const handleReset = () => {
    setMuscleGroup('All');
    setDifficulty('All');
    setEquipment('All');
    applyFilters({ muscleGroup: 'All', difficulty: 'All', equipment: 'All' });
    onClose();
  };

  const renderFilterSection = (title, items, selected, setSelected) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterOptionsContainer}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, selected === item && styles.filterChipActive]}
            onPress={() => setSelected(item)}
          >
            <Text style={[styles.filterChipText, selected === item && styles.filterChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderFilterSection("Muscle Group", muscleGroups, muscleGroup, setMuscleGroup)}
              {renderFilterSection("Difficulty", difficulties, difficulty, setDifficulty)}
              {renderFilterSection("Equipment", ['All', ...equipmentList], equipment, setEquipment)}
            </ScrollView>
             <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#1E2328',
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 25,
  },
  filterTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    backgroundColor: '#2A2D32',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#01D38D',
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#191E29',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2D32'
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#2A2D32',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#01D38D',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginLeft: 10,
  },
  applyButtonText: {
    color: '#191E29',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { FilterModal }; 