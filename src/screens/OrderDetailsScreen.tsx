import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
// import {
//   Camera,
//   useCameraDevice,
//   useCameraPermission,
//   useCodeScanner,
// } from 'react-native-vision-camera';

import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import {
  fetchOrderDetails,
  updatePickedQuantity,
  generateOrderInvoice,
  scanSKU,
} from '../api/home/homeApi';
import { useToast } from '../utilities/ToastContext';

interface OrderItem {
  id: string;
  product_name: string;
  sku: string;
  picked_qty: number;
  quantity: number;
}

const OrderDetailsScreen = ({ route, navigation }: any) => {
  const {orderId, orderNumber} = route.params ?? {};;
  const { showToast } = useToast();

  // --- STATE ---
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [tempQty, setTempQty] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [isInvoicing, setIsInvoicing] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // --- CAMERA & SCANNER STATE ---
  const [isScannerVisible, setIsScannerVisible] = useState(false);
//   const { hasPermission, requestPermission } = useCameraPermission();

  // New Architecture optimized device selector
//   const device = useCameraDevice('back');

  useEffect(() => {
    loadOrderData();
    // if (!hasPermission) requestPermission();
  }, []);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrderDetails(orderId);
      setOrderInfo(data);
      setItems(data.items || []);
    } catch (error) {
      showToast('Failed to load order items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- SCAN / SEARCH API LOGIC ---
  const processSKUScan = async (sku: string) => {
    if (!sku || isProcessingScan) return;

    setIsProcessingScan(true);
    setLoading(true);
    try {
      // API call returns the item object from result.data.item
      const itemData = await scanSKU(orderId, sku);

      setItems(prev =>
        prev.map(item =>
          item.sku.toLowerCase() === sku.toLowerCase()
            ? { ...item, picked_qty: itemData.picked_qty }
            : item,
        ),
      );

      showToast(`${itemData.product_name} picked!`, 'success');
      setSearchQuery('');
      setIsScannerVisible(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'SKU not found';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setIsProcessingScan(false);
    }
  };

  // Modern Vision Camera V4 Built-in Code Scanner
//   const codeScanner = useCodeScanner({
//     codeTypes: ['ean-13', 'code-128', 'qr', 'code-39'],
//     onCodeScanned: codes => {
//       // Logic to prevent multiple triggers for the same scan session
//       if (codes.length > 0 && isScannerVisible && !isProcessingScan) {
//         const value = codes[0].value;
//         if (value) processSKUScan(value);
//       }
//     },
//   });

  // --- PICK ITEM LOGIC ---
  const handleConfirmPicked = async () => {
    if (!selectedItem) return;
    setUpdating(true);
    try {
      const result = await updatePickedQuantity(
        orderId,
        selectedItem.id,
        tempQty,
      );
      setItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, picked_qty: result.picked_qty }
            : item,
        ),
      );
      showToast('Quantity updated', 'success');
      setSelectedItem(null);
    } catch (error) {
      showToast('Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // --- INVOICE LOGIC ---
  const handleGenerateInvoice = async () => {
    Alert.alert(
      'Generate Invoice',
      'Finalize this order and generate invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsInvoicing(true);
            try {
              await generateOrderInvoice(orderId);
              showToast('Invoice generated', 'success');
              navigation.navigate('MainTabs', { screen: 'Orders' });
            } catch (error: any) {
              showToast('Invoice failed', 'error');
            } finally {
              setIsInvoicing(false);
            }
          },
        },
      ],
    );
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(
      item =>
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, items]);

  const renderItem = ({ item }: { item: OrderItem }) => {
    const isCompleted = item.picked_qty === item.quantity;
    const isStarted = item.picked_qty > 0 && item.picked_qty < item.quantity;

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          isCompleted ? styles.itemCardSuccess : styles.itemCardPending,
          isStarted && styles.itemCardWarning,
        ]}
        onPress={() => {
          setSelectedItem(item);
          setTempQty(item.quantity);
        }}>
        <View style={styles.itemInfo}>
          <Text style={styles.skuText}>SKU: {item.sku}</Text>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product_name}
          </Text>
          <Text style={[styles.qtyText, isCompleted && {color: '#166534'}]}>
            <Text style={styles.qtyBold}>{item.picked_qty}</Text> /{' '}
            {item.quantity}
          </Text>
        </View>
        <Icon
          xml={isCompleted ? SVG_ICONS.tickIcon : SVG_ICONS.editIcon}
          size={24}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* The back button (if uncommented) stays its fixed size */}
          {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
    <Icon xml={SVG_ICONS.backIcon} />
  </TouchableOpacity> */}

          {/* flex: 1 tells this View to take up only the AVAILABLE horizontal space */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {orderNumber}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {orderInfo?.client_name || 'Loading...'}
            </Text>
          </View>
        </View>

        {/* SCAN / SEARCH AREA */}
        <View style={styles.scanContainer}>
          <Text style={styles.scanLabel}>BARCODE / SKU SCAN</Text>
          <View style={styles.scanRow}>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => setIsScannerVisible(true)}>
              <Icon xml={SVG_ICONS.cameraIcon} />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Scan or Type SKU..."
                placeholderTextColor="#94A3B8"
                style={styles.skuInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="characters"
                onSubmitEditing={() => processSKUScan(searchQuery)}
              />
            </View>
          </View>
        </View>

        {/* LIST */}
        {loading && !items.length ? (
          <ActivityIndicator
            color="#C62828"
            size="large"
            style={{marginTop: 50}}
          />
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items found.</Text>
              </View>
            }
          />
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.invoiceBtn,
              items.some(i => i.picked_qty > 0)
                ? styles.invoiceBtnActive
                : styles.invoiceBtnDisabled,
            ]}
            onPress={handleGenerateInvoice}
            disabled={!items.some(i => i.picked_qty > 0) || isInvoicing}>
            {isInvoicing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                style={[
                  styles.invoiceBtnText,
                  items.some(i => i.picked_qty > 0) && {color: '#FFF'},
                ]}>
                Generate Invoice ({items.filter(i => i.picked_qty > 0).length}{' '}
                Items)
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* INTEGRATED SCANNER MODAL */}
        <Modal visible={isScannerVisible} animationType="fade">
          <View style={styles.cameraOverlay}>
            {/* {device && hasPermission ? (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isScannerVisible}
                codeScanner={codeScanner}
                enableZoomGesture
              />
            ) : (
              <Text style={{ color: '#fff' }}>Camera Access Required</Text>
            )} */}

            {/* Viewfinder UI */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinder} />
              <Text style={styles.scanInstruction}>
                Align Barcode within the frame
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeCamera}
              onPress={() => setIsScannerVisible(false)}>
              <Text style={styles.closeCameraText}>Cancel Scan</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* QUANTITY PICKER MODAL */}
        <Modal visible={!!selectedItem} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.handle} />
              <Text style={styles.pickerTitle}>
                {selectedItem?.product_name}
              </Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setTempQty(Math.max(0, tempQty - 1))}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterVal}>{tempQty}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() =>
                    setTempQty(
                      Math.min(selectedItem?.quantity || 0, tempQty + 1),
                    )
                  }>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelectedItem(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirmPicked}>
                  {updating ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.confirmText}>Confirm Pick</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%', // Ensure the header matches screen width
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTextContainer: {
    flex: 1, // CRITICAL: This allows the container to shrink
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    // No fixed width here; flex: 1 on parent handles it
  },
  headerSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  backBtn: {backgroundColor: '#F1F5F9', padding: 10, borderRadius: 12},
  scanContainer: {
    backgroundColor: '#0F172A',
    margin: 16,
    borderRadius: 28,
    padding: 24,
  },
  scanLabel: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  scanRow: {flexDirection: 'row', gap: 12},
  cameraBtn: {
    backgroundColor: '#334155',
    width: 55,
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  skuInput: {color: '#FFF', fontSize: 16, fontWeight: '700', height: 55},
  listPadding: {padding: 16, paddingBottom: 120},
  itemCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  itemCardPending: {backgroundColor: '#EFF6FF', borderColor: '#DBEAFE'},
  itemCardSuccess: {backgroundColor: '#F0FDF4', borderColor: '#DCFCE7'},
  itemCardWarning: {backgroundColor: '#FFFBEB', borderColor: '#FEF3C7'},
  itemInfo: {flex: 1},
  skuText: {fontSize: 11, color: '#64748B', fontWeight: '800'},
  itemName: {fontSize: 17, fontWeight: '800', color: '#1E293B'},
  qtyText: {fontSize: 15, color: '#94A3B8', fontWeight: '700', marginTop: 8},
  qtyBold: {color: '#1E293B', fontSize: 22, fontWeight: '900'},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  invoiceBtn: {padding: 20, borderRadius: 22, alignItems: 'center'},
  invoiceBtnDisabled: {backgroundColor: '#F1F5F9'},
  invoiceBtnActive: {backgroundColor: '#C62828'},
  invoiceBtnText: {color: '#94A3B8', fontWeight: '900', fontSize: 16},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  pickerTitle: {fontSize: 18, fontWeight: '800', textAlign: 'center'},
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginVertical: 30,
  },
  counterBtn: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {fontSize: 24, fontWeight: 'bold'},
  counterVal: {fontSize: 48, fontWeight: '900', color: '#C62828'},
  modalActions: {flexDirection: 'row', gap: 10},
  cancelBtn: {flex: 1, padding: 20, alignItems: 'center'},
  cancelText: {fontWeight: 'bold', color: '#64748B'},
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmText: {color: '#FFF', fontWeight: 'bold'},
  cameraOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {alignItems: 'center', justifyContent: 'center'},
  viewfinder: {
    width: 260,
    height: 260,
    borderColor: '#F87171',
    borderRadius: 30,
    borderStyle: 'dashed',
    borderWidth: 3,
  },
  scanInstruction: {
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  closeCamera: {
    position: 'absolute',
    bottom: 60,
    backgroundColor: '#334155',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
  },
  closeCameraText: {color: '#FFF', fontWeight: 'bold', fontSize: 16},
  emptyContainer: {alignItems: 'center', marginTop: 50},
  emptyText: {color: '#94A3B8'},
});

export default OrderDetailsScreen;
