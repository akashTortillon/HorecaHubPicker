import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

type ToastType = 'success' | 'error' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [visible, setVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToast = useCallback(
    (msg: string, toastType: ToastType = 'success') => {
      setMessage(msg);
      setType(toastType);
      setVisible(true);

      // Animate In
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto Hide after 3 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 3000);
    },
    [],
  );

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10B981'; // Emerald
      case 'error':
        return '#F43F5E'; // Rose
      case 'warning':
        return '#F59E0B'; // Amber
      default:
        return '#1E293B';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: fadeAnim, backgroundColor: getBackgroundColor() },
          ]}
        >
          {/* <MaterialIcons name={getIcon()} size={20} color="white" /> */}
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100, // Above the tab bar
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
});
