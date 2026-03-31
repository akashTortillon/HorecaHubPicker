import React, {useState} from 'react'; // Added useState
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';
import {useAuthStore} from '../store/useAuthStore';
import { primaryRed } from '../utilities/ThemeContext';

export const CustomHeader = () => {
  const insets = useSafeAreaInsets();

  // 1. Local state for online status (You can move this to useAuthStore later)
  const [isOnline, setIsOnline] = useState(true);

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    // Optional: Add a small toast or haptic feedback here
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: () => logout()},
    ]);
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>SmartPicker</Text>
          <View style={styles.userRow}>
            <Icon xml={SVG_ICONS.userIcon} size={14} color="#FFF" />
            <Text style={styles.userInfo} numberOfLines={1}>
              {user?.full_name || 'Picker'} ({user?.employee_id || 'ID'})
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* 2. Wrapped the badge in TouchableOpacity to make it a switch */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleOnlineStatus}
            style={[
              styles.onlineBadge,
              {backgroundColor: isOnline ? '#43A047' : '#546E7A'}, // Green if online, Gray if offline
            ]}>
            {/* 3. Changed icon/text based on state */}
            <Icon
              xml={isOnline ? SVG_ICONS.onlineIcon : SVG_ICONS.offlineIcon}
              size={10}
            />
            <Text style={styles.onlineText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.7}>
            <Icon xml={SVG_ICONS.signOut} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: primaryRed,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  leftSection: {flex: 1, marginRight: 10},
  title: {color: '#FFF', fontSize: 23, fontWeight: '900'},
  userRow: {flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6},
  userInfo: {color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600'},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 10},
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    minWidth: 75, // Keeps badge size consistent when text changes
    justifyContent: 'center',
  },
  onlineText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 15,
  },
});
