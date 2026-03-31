import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import { loginUser } from '../api/auth/authApi';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../utilities/ToastContext';
import { primaryRed } from '../utilities/ThemeContext';

const LoginScreen = ({ navigation }: any) => {
  // --- STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const authLogin = useAuthStore(state => state.login);

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      // API call using the specific payload format: { username, password }
      const { user, token } = await loginUser({
        username: email.trim().toLowerCase(),
        password: password,
      });

      // Update Zustand store and persist data
      await authLogin(user, token);

      // Navigator will automatically switch to MainTabs due to token presence,
      // but replace is a safe fallback.
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.log('error is', error)
      const errorMsg =
        error.response?.data?.message || 'Something went wrong. Try again!';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Brand Header */}
          <View style={styles.logoSection}>
            {/* <View style={styles.iconWrapper}>
              <Icon xml={SVG_ICONS.scanFrameWhite} size={48} />
            </View> */}
            <Text style={styles.brandName}>SmartPicker</Text>
            <Text style={styles.brandSub}>Logistics & Warehouse</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. pranav@gmail.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FC0808', // Deep Red brand color
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    marginBottom: 10,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  brandSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 30,
    paddingBottom: 40,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 58,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  loginBtn: {
    backgroundColor: primaryRed,
    height: 62,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default LoginScreen;
