import React, {useState} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import OrderScreen from '../screens/OrderScreen';
import InvoiceScreen from '../screens/InvoiceScreen';
import DispatchTrackingScreen from '../screens/DispatchTrackingScreen';
import {CustomHeader} from '../components/CustomHeader';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';

const Tab = createBottomTabNavigator();

// STABLE COMPONENT REFERENCE: Prevents the "in" operator crash in Nav 7
const EmptyComponent = () => null;

const MainTabs = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          header: () => <CustomHeader />,
          tabBarStyle: {backgroundColor: '#fff', borderTopWidth: 0},
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
        }}>
        <Tab.Screen
          name="Dashboard"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({color}) => (
              <Icon xml={SVG_ICONS.dashboard} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Orders"
          component={OrderScreen}
          options={{
            tabBarLabel: 'Orders',
            tabBarIcon: ({color}) => (
              <Icon xml={SVG_ICONS.boxOutline} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="InvoiceScreen"
          component={InvoiceScreen}
          options={{
            tabBarLabel: 'Invoices',
            tabBarIcon: ({color}) => (
              <Icon xml={SVG_ICONS.invoice} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="DispatchTrackingScreen"
          component={DispatchTrackingScreen}
          options={{
            tabBarLabel: 'Dispatch',
            tabBarIcon: ({color}) => (
              <Icon xml={SVG_ICONS.truckIcon} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="More"
          component={EmptyComponent} // FIXED
          listeners={{
            tabPress: e => {
              e.preventDefault();
              setMenuVisible(true);
            },
          }}
          options={{
            tabBarLabel: 'More',
            tabBarIcon: ({color}) => (
              <Icon xml={SVG_ICONS.more} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.popupContainer}>
            <View style={styles.horizontalMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  // Now navigating to the Stack Navigator level
                  navigation.navigate('WarehouseInventory');
                }}>
                <Icon xml={SVG_ICONS.stocksIcon} size={32} color="#64748B" />
                <Text style={styles.menuLabel}>STOCKS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {setMenuVisible(false)
                   navigation.navigate('Returns');}
                }>
                <Icon xml={SVG_ICONS.returnIcon} size={32} color="#64748B" />
                <Text style={styles.menuLabel}>RETURNS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setMenuVisible(false)}>
                <Icon xml={SVG_ICONS.settingsIcon} size={32} color="#64748B" />
                <Text style={styles.menuLabel}>SETTINGS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  popup: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 34, // extra padding for safe area
    minHeight: 220,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 12,
    marginRight: -12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLabel: {
    fontSize: 17,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end', // Aligns items to the bottom
    alignItems: 'center',
    // Adjust this value to match your TabBar height.
    // Usually 60-80 depending on device safe areas.
    paddingBottom: 85,
  },
  popupContainer: {
    width: '94%', // Slightly wider to look better sitting on the bar
    backgroundColor: '#FFFFFF',
    borderRadius: 35, // Adjusting radius for a tighter pill look above the bar
    paddingVertical: 25,
    paddingHorizontal: 10,
    // Add a slight bottom border or shadow to separate from the tab bar
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2}, // Shadow goes upward
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  horizontalMenu: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100, // Fixed width helps center the icon/text precisely
  },
  menuLabel: {
    marginTop: 8,
    fontSize: 12, // Slightly smaller to match standard UI patterns
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.1,
  },
});

export default MainTabs;
