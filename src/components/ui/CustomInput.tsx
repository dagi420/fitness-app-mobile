import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomInputProps extends TextInputProps {
  label: string;
  unit?: string;
  containerStyle?: ViewStyle;
  error?: string;
  touched?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  unit,
  containerStyle,
  error,
  touched,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = isFocused ? '#01D38D' : '#2A2D32';
  const hasError = touched && error;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: hasError ? '#FF4757' : borderColor }]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#696E79"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    borderWidth: 2,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 18,
  },
  unit: {
    color: '#696E79',
    fontSize: 16,
    marginLeft: 10,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 12,
    marginTop: 5,
  },
});

export default CustomInput; 