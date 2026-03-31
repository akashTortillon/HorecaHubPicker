import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';
import {fetchReturnItems} from '../api/home/homeApi';
import {useToast} from '../utilities/ToastContext';

const WarehouseScannerScreen = ({route, navigation}: any) => {
  const {rmaId, rmaNumber} = route.params;
  const {showToast} = useToast();
  
  const [skuInput, setSkuInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    loadOrderItems();
  }, [rmaId]);

  const loadOrderItems = async () => {
    try {
      setLoading(true);
      // Fetching items using the ID passed from the previous screen
      const data = await fetchReturnItems(rmaId);
      
      // Assuming API returns { items: [...] } or an array directly
      // Based on previous context, it's usually data.items
      setOrderItems(data?.items || []);
    } catch (error) {
      showToast('Failed to fetch order items', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon xml={SVG_ICONS.arrowLeft} size={20} color={'#1E293B'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warehouse Scan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dashed Scanning Area */}
        <View style={styles.scanContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.barcodeVisual}>|||||</Text>
          </View>

          <Text style={styles.scanTitle}>Scan at Warehouse</Text>
          <Text style={styles.scanSubtitle}>
            Validate items from {rmaNumber} against original order.
          </Text>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter SKU or Scan"
              placeholderTextColor="#CBD5E1"
              value={skuInput}
              onChangeText={setSkuInput}
              autoFocus
              autoCapitalize="characters"
            />
          </View>
        </View>

        <Text style={styles.queueHeader}>PROCESSING QUEUE</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#C62828" style={{marginTop: 20}} />
        ) : orderItems.length > 0 ? (
          orderItems.map((item: any) => (
            <View key={item.id} style={styles.queueCard}>
              <View style={styles.boxIconContainer}>
                <Icon xml={SVG_ICONS.boxOutline} size={20} color={'#C62828'} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>
                  QTY: {item.quantity} {item.unit || ''} • SKU: {item.sku || 'N/A'}
                </Text>
              </View>
              {/* Optional: Add a checkmark if the SKU matches the input */}
              {skuInput.toUpperCase() === item.sku?.toUpperCase() && (
                 <Icon xml={SVG_ICONS.tickIcon} size={20} color={'#10B981'} />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No items found for this order.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    gap: 15,
  },
  backBtn: {padding: 5},
  headerTitle: {fontSize: 20, fontWeight: '900', color: '#1E293B'},
  content: {padding: 20},
  scanContainer: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  barcodeVisual: {fontSize: 32, color: '#C62828', letterSpacing: -2, fontWeight: 'bold'},
  scanTitle: {fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 10},
  scanSubtitle: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  inputBox: {
    marginTop: 30,
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 5,
  },
  textInput: {
    padding: 18,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  queueHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    marginTop: 35,
    marginBottom: 15,
    letterSpacing: 1,
  },
  queueCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    marginBottom: 12,
  },
  boxIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {fontSize: 16, fontWeight: '800', color: '#1E293B'},
  itemMeta: {fontSize: 12, color: '#94A3B8', fontWeight: '700', marginTop: 4},
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
    fontWeight: '600',
  },
});

export default WarehouseScannerScreen;