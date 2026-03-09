import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';
import api from '../api/axiosConfig';

const {width} = Dimensions.get('window');

interface DispatchItem {
  id: string;
  invoice_id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  driver_name: string;
  vehicle_number: string;
  status: string;
  assigned_at: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  pdf_url: string | null;
}

const DispatchTrackingScreen = () => {
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;

  const fetchDispatches = useCallback(
    async (pageNum: number, append = false) => {
      if (loadingMore || (pageNum > 1 && !hasMore)) return;

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const response = await api.get(
          `picker/dispatches/?page=${pageNum}&page_size=${pageSize}`,
        );
        const items = response.data?.results?.data || [];

        const mapped: DispatchItem[] = items.map((item: any) => ({
          id: item.id,
          invoice_id: item.invoice_id,
          invoice_number: item.invoice_number,
          order_id: item.order_id,
          order_number: item.order_number,
          driver_name: item.driver_name,
          vehicle_number: item.vehicle_number,
          status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          assigned_at: item.assigned_at,
          dispatched_at: item.dispatched_at,
          delivered_at: item.delivered_at,
          pdf_url: item.pdf_url,
        }));

        if (append) {
          setDispatches(prev => [...prev, ...mapped]);
        } else {
          setDispatches(mapped);
        }

        setHasMore(mapped.length === pageSize);
      } catch (error) {
        console.error('Failed to fetch dispatches:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMore],
  );

  useEffect(() => {
    fetchDispatches(1);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDispatches(nextPage, true);
    }
  };

  const renderItem = ({item}: {item: DispatchItem}) => {
    const isDelivered = item.status.toLowerCase() === 'delivered';
    const isDispatched = item.status.toLowerCase() === 'dispatched';

    return (
      <View
        style={[
          styles.card,
          isDelivered
            ? styles.deliveredCard
            : isDispatched
            ? styles.dispatchedCard
            : styles.assignedCard,
        ]}>
        {/* Card Header - Uses Flex to prevent Tag overlap */}
        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.invoiceId} numberOfLines={1}>
              {item.invoice_number}
            </Text>
            <Text style={styles.orderId} numberOfLines={1}>
              {item.order_number}
            </Text>
          </View>
          <View
            style={[
              styles.statusTag,
              isDelivered
                ? styles.tagDelivered
                : isDispatched
                ? styles.tagDispatched
                : styles.tagAssigned,
            ]}>
            <Text style={styles.statusTagText}>{item.status}</Text>
          </View>
        </View>

        {/* Logistics Detail Box */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Icon xml={SVG_ICONS.userIcon} size={16} color="#64748B" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.driver_name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon xml={SVG_ICONS.truckIcon} size={16} color="#64748B" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.vehicle_number}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon xml={SVG_ICONS.calenderIcon} size={16} color="#64748B" />
            <Text style={styles.detailText} numberOfLines={1}>
              Assigned: {new Date(item.assigned_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Commented Reschedule Button as requested */}
        {/* {!isDelivered && (
          <TouchableOpacity style={styles.rescheduleBtn}>
            <Icon xml={SVG_ICONS.calenderIcon} size={18} />
            <Text style={styles.rescheduleBtnText}>Reschedule Delivery</Text>
          </TouchableOpacity>
        )} 
        */}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon xml={SVG_ICONS.truckIcon} size={28} color="#C62828" />
        <Text style={styles.headerTitle}>Dispatch & Tracking</Text>
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator color="#C62828" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={dispatches}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#C62828" style={{marginVertical: 20}} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No dispatches found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    width: '100%', // Use full width of list container
  },
  assignedCard: {backgroundColor: '#EEF2FF', borderColor: '#D1E3FF'},
  dispatchedCard: {backgroundColor: '#FFF3E0', borderColor: '#FFCC80'},
  deliveredCard: {backgroundColor: '#E6F9F3', borderColor: '#C2F0E3'},

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  headerInfo: {
    flex: 1, // Allows the text to take up only available space, preventing tag overflow
  },
  invoiceId: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  orderId: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: width * 0.3, // Limit tag width to 30% of screen
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAssigned: {backgroundColor: '#4F46E5'},
  tagDispatched: {backgroundColor: '#F59E0B'},
  tagDelivered: {backgroundColor: '#439F48'},
  statusTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1, // Prevents long names from pushing outside the box
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 40,
  },
});

export default DispatchTrackingScreen;
