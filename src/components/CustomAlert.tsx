import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ButtonType = 'primary' | 'destructive' | 'default';

interface AlertButton {
  text: string;
  onPress: () => void;
  type?: ButtonType;
}

interface CustomAlertProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons: AlertButton[];
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons,
  iconName,
  iconColor = '#FFFFFF',
}) => {
  const getButtonStyles = (type: ButtonType = 'default') => {
    switch (type) {
      case 'primary':
        return {
          button: styles.primaryButton,
          text: styles.primaryButtonText,
        };
      case 'destructive':
        return {
          button: styles.destructiveButton,
          text: styles.destructiveButtonText,
        };
      default:
        return {
          button: styles.defaultButton,
          text: styles.defaultButtonText,
        };
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.alertBox}>
          {iconName && (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={48} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((buttonInfo, index) => {
              const { button, text } = getButtonStyles(buttonInfo.type);
              return (
                <TouchableOpacity
                  key={index}
                  style={[button, { flex: 1, marginRight: buttons.length > 1 && index < buttons.length -1 ? 10 : 0 }]}
                  onPress={() => {
                    buttonInfo.onPress();
                    onClose();
                  }}
                >
                  <Text style={text}>{buttonInfo.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  alertBox: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2A2D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#A0A5B1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#01D38D',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#191E29',
    fontSize: 16,
    fontWeight: 'bold',
  },
  destructiveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultButton: {
    backgroundColor: '#2A2D32',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  defaultButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomAlert; 