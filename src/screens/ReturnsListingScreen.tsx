import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';
import {fetchDeliveredOrders, fetchActiveReturns} from '../api/home/homeApi';
import {useToast} from '../utilities/ToastContext';

const ReturnsListingScreen = ({navigation}: any) => {
  const {showToast} = useToast();
  const [orders, setOrders] = useState<any>([]);
  const [activeReturns, setActiveReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [delivered] = await Promise.all([
        fetchDeliveredOrders(),
      ]);
      setOrders(delivered || []);
    } catch (error) {
      showToast('Could not load returns data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderActiveReturn = (item: any) => (
    <View key={item.id} style={styles.activeCard}>
      <View style={styles.activeHeader}>
        <View style={{flex: 1}}>
          <Text style={styles.rmaTag}>{item.rma_number}</Text>
          <Text style={styles.activeOrderId}>{item.order_number}</Text>
        </View>
        <View style={styles.collectedBadge}>
          <Text style={styles.collectedText}>Collected</Text>
        </View>
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>INVOICE:</Text>
          <Text style={styles.detailValue}>INV-{item.order_number.split('-').pop()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CREDIT NOTE:</Text>
          <Text style={[styles.detailValue, {color: '#10B981'}]}>CN-{item.id.slice(0, 4).toUpperCase()}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.scanBtn}
        onPress={() => 
          navigation.navigate('OrderDetails', {
            orderId: item.id,
            orderNumber: item.rma_number,
            isReturn: true,
          })}>
        <Icon xml={SVG_ICONS.barcodeIcon} size={20} color="#FFF" />
        <Text style={styles.scanBtnText}>Scan Items @ Warehouse</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── FULL SCREEN LOADER ── */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View>
            <ActivityIndicator size="large" color="#C62828" />
            <Text style={styles.loadingText}>Fetching Returns...</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Icon xml={SVG_ICONS.returnIcon} size={28} color="#C62828" />
        <Text style={styles.headerTitle}>Returns Hub</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadData(true)} 
            tintColor="#C62828" 
            colors={['#C62828']} // Android color
          />
        }
        ListHeaderComponent={() => (
          <Text style={styles.sectionTitle}>DELIVERED ORDERS</Text>
        )}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.deliveredCard}
            activeOpacity={0.7}
            onPress={() => 
              navigation.navigate('OrderDetails', {
                orderId: item.id,
                orderNumber: item.order_number,
                isReturn: true,
              })}>
            <View style={{flex: 1}}>
              <Text style={styles.orderIdText}>{item.order_number}</Text>
              <Text style={styles.clientText}>{item.customer_name}</Text>
            </View>
            <View style={styles.chevronBg}>
               <Text style={styles.chevron}>〉</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No delivered orders found.</Text> : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  
  // Loader Styles
  loadingOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    // padding: 30,
    // // backgroundColor: '#FFF',
    // borderRadius: 20,
    // // elevation: 5,
    // // shadowColor: '#000',
    // // shadowOpacity: 0.1,
    // // shadowRadius: 10,
    // alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    backgroundColor: '#FFF',
  },
  headerTitle: {fontSize: 26, fontWeight: '900', color: '#1E293B'},
  listPadding: {paddingHorizontal: 20, paddingBottom: 40},
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  deliveredCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 12,
  },
  orderIdText: {fontSize: 18, fontWeight: '900', color: '#1E293B'},
  clientText: {fontSize: 15, color: '#475569', marginTop: 4, fontWeight: '700'},
  chevronBg: {width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center'},
  chevron: {fontSize: 14, color: '#6366F1', fontWeight: '900'},
  emptyText: {textAlign: 'center', color: '#94A3B8', marginTop: 50, fontWeight: '600'},

  activeCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  activeHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20},
  rmaTag: {fontSize: 11, fontWeight: '900', color: '#C62828', marginBottom: 4},
  activeOrderId: {fontSize: 22, fontWeight: '900', color: '#1E293B'},
  collectedBadge: {backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10},
  collectedText: {color: '#C62828', fontSize: 11, fontWeight: '800'},
  
  detailsBox: {backgroundColor: '#F8FAFC', borderRadius: 20, padding: 15, marginBottom: 20},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8},
  detailLabel: {fontSize: 11, fontWeight: '800', color: '#94A3B8'},
  detailValue: {fontSize: 13, fontWeight: '800', color: '#1E293B'},
  divider: {height: 1, backgroundColor: '#EDF2F7', marginVertical: 4},

  scanBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  scanBtnText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
});

export default ReturnsListingScreen;