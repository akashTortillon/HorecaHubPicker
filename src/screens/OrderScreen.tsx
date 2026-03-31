import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import OrdersCard from '../components/OrdersCard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import { fetchOrders } from '../api/home/homeApi';

const rnBiometrics = new ReactNativeBiometrics();

interface OrderItem {
  id: string;
  order_number: string;
  status: string;
  total_amount: string;
  item_count: number;
}

const OrderScreen = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = async (search = '') => {
    try {
      const data = await fetchOrders('pending', search);
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useEffect(() => {
  //   loadOrders(searchQuery);
  // }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      // 1. Logic to run when the screen is FOCUSED
      console.log('User entered the order Screen. Fetching fresh data...');
      loadOrders(searchQuery);

      return () => {
        // 2. Logic to run when the screen is BLURRED (Unfocused)
        console.log('User left the order Screen. Cleaning up...');
        // Example: Stop a timer, close a socket, or pause a video
      };
    }, [searchQuery]) // Dependencies: only re-run if userId changes
  );

 const handleOrderPress = async (item: OrderItem) => {
   try {
     // 1. Check hardware availability
     const { available, biometryType, error } =
       await rnBiometrics.isSensorAvailable();

     if (available) {
       let promptMessage = 'Authenticate to view details';

       // Specific labels for iOS experience
       if (biometryType === BiometryTypes.FaceID)
         promptMessage = 'Log in with Face ID';
       if (biometryType === BiometryTypes.TouchID)
         promptMessage = 'Log in with Touch ID';

       // 2. Trigger the prompt
       const { success } = await rnBiometrics.simplePrompt({
         promptMessage: promptMessage,
         cancelButtonText: 'Cancel', // Required for some Android versions/New Arch
       });

       if (success) {
         navigateToDetails(item);
       }
     } else {
       // Fallback if Biometrics are disabled or restricted by the user
       console.warn('Biometrics not available:', error);
       navigateToDetails(item);
     }
   } catch (error) {
     // Catch specific iOS "User Cancel" or "System Cancel" to prevent app hang
     console.log('Biometric error or cancellation', error);
   }
 };

  const navigateToDetails = (item: OrderItem) => {
    navigation.navigate('OrderDetails', {
      orderId: item.id,
      orderNumber: item.order_number,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(searchQuery);
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: '#EBF2FF', border: '#D1E3FF', text: '#E53935' };
      case 'processing':
        return { bg: '#FFFBEB', border: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#F1F5F9', border: '#E2E8F0', text: '#475569' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Icon xml={SVG_ICONS.searchIcon} size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search by Order Number..."
            placeholderTextColor={'#94A3B8'}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C62828"
          />
        }
      >
        <Text style={styles.resultsText}>
          {searchQuery
            ? `Search Results (${orders.length})`
            : `Pending Orders (${orders.length})`}
        </Text>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#C62828"
            style={{ marginTop: 50 }}
          />
        ) : orders.length > 0 ? (
          orders.map(item => {
            const config = getStatusConfig(item.status);
            return (
              <OrdersCard
                key={item.id}
                onPress={() => handleOrderPress(item)}
                orderId={item.order_number}
                clientName={`Items: ${item.item_count}`}
                status={
                  item.status.charAt(0).toUpperCase() + item.status.slice(1)
                }
                backgroundColor={config.bg}
                borderColor={config.border}
                statusColor={config.text}
              />
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFC' },
  searchWrapper: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 15,
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  scrollContent: { padding: 20, paddingBottom: 100 },
  resultsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OrderScreen;
