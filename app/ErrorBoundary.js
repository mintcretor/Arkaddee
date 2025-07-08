// ErrorBoundary.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught error:', error);
    console.error('📱 Error Info:', errorInfo);
    console.error('📱 Platform:', Platform.OS);
    console.error('📱 Is Tablet:', this.isTablet());

    this.setState({
      error,
      errorInfo
    });
  }

  isTablet = () => {
    const { width, height } = Dimensions.get('window'); // <-- ใช้ Dimensions ที่ import มาได้เลย
    return Math.min(width, height) >= 600;
  };

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    try {
      // ล้าง navigation stack และไปหน้า login
      router.dismissAll();
      router.replace('/(auth)/login/login');
    } catch (e) {
      console.error('Error restarting app:', e);
      // Force reload
      if (Platform.OS === 'ios') {
        const { NativeModules } = require('react-native');
        if (NativeModules.DevSettings) {
          NativeModules.DevSettings.reload();
        }
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>เกิดข้อผิดพลาด</Text>
          <Text style={styles.subtitle}>
            {Platform.OS === 'ios' && this.isTablet()
              ? 'ตรวจพบปัญหาเฉพาะ iPad'
              : 'แอปพลิเคชันมีปัญหา'
            }
          </Text>

          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>
                {this.state.error?.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRestart}
          >
            <Text style={styles.buttonText}>เริ่มต้นใหม่</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  debugContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    width: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f',
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ErrorBoundary;