import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import OrdersCard from '../components/OrdersCard';
import { fetchPickerHomeData } from '../api/home/homeApi';

interface ActivityItem {
  id: string;
  order_number: string;
  status: string;
}

interface HomeData {
  pending_orders: number;
  pending_dispatch: number;
  recent_activity: ActivityItem[];
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<HomeData | null>(null);

  const loadHomeData = async () => {
    try {
      const res = await fetchPickerHomeData();
      setData(res);
    } catch (error) {
      console.log('Failed to load home data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#C62828"
        />
      }>
      {/* Top Stat Cards Row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: '#FF7043'}]}
          onPress={() => {
            navigation.navigate('Orders');
          }}>
          <View>
            <Icon xml={SVG_ICONS.boxOutline} />
            <Text style={styles.statNumber}>{data?.pending_orders ?? 0}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: '#7E57C2'}]}
          onPress={() => {
            navigation.navigate('DispatchTrackingScreen');
          }}>
          <View>
            <Icon xml={SVG_ICONS.invoice} />
            <Text style={styles.statNumber}>{data?.pending_dispatch ?? 0}</Text>
            <Text style={styles.statLabel}>Pending Dispatch</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Returns Management Row */}
      <TouchableOpacity style={styles.returnsCard}>
        <View style={styles.returnsContent}>
          <View style={styles.returnsHeader}>
            <View>
              <Icon xml={SVG_ICONS.returns} size={20} color="red" />
            </View>
            <Text style={styles.returnsTitle}>RETURNS MANAGEMENT</Text>
          </View>
          <Text style={styles.returnsText}>
            <Text style={styles.returnsCount}>0 </Text>
            To Process at Warehouse
          </Text>
        </View>
        <Icon xml={SVG_ICONS.arrowRight} />
      </TouchableOpacity>

      {/* Recent Activity Section */}
      <View style={styles.activityWrapper}>
        <View style={styles.sectionHeader}>
          <Icon xml={SVG_ICONS.timer} color="#94A3B8" />
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        </View>

        {data?.recent_activity && data.recent_activity.length > 0 ? (
          data.recent_activity.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                navigation.navigate('OrderDetails', {
                  orderId: item.id,
                  orderNumber: item.order_number,
                })
              }>
              <OrdersCard
                onPress={() => {}}
                orderId={item.order_number}
                clientName="Warehouse Order" // API doesn't provide client name in this endpoint
                status={
                  item.status.charAt(0).toUpperCase() + item.status.slice(1)
                }
                backgroundColor={
                  item.status === 'pending' ? '#EBF2FF' : '#FFFBEB'
                }
                borderColor={item.status === 'pending' ? '#D1E3FF' : '#FEF3C7'}
                statusColor={item.status === 'pending' ? '#E53935' : '#D97706'}
              />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity found.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFC' },
  scrollContent: { padding: 16, paddingBottom: 30 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    height: 165,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  statNumber: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: -5,
    marginTop: 10,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  returnsCard: {
    backgroundColor: '#323E4D',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    marginBottom: 30,
  },
  returnsContent: { flex: 1 },
  returnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  returnsTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  returnsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  returnsCount: { fontWeight: '800', fontSize: 22 },
  activityWrapper: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    backgroundColor: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
    fontWeight: '600',
  },
});

export default HomeScreen;
