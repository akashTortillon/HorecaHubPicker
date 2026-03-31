import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ScrollView,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  Code,
} from 'react-native-vision-camera';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import {
  fetchOrderDetails,
  updatePickedQuantity,
  generateOrderInvoice,
  fetchReturnItems,          
  collectReturnOrder,        
  fetchDrivers,         
  fetchVehicles,     
} from '../api/home/homeApi';
import { useToast } from '../utilities/ToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  product_name: string;
  variant_sku: string;
  barcode: string | null;
  picked_qty: number;
  quantity: number;
  unit_price: string;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const RETURN_REASONS = [
  { id: '1', label: 'Product Damaged' },
  { id: '2', label: 'Wrong Item Delivered' },
  { id: '3', label: 'Not Required Anymore' },
  { id: '4', label: 'Quality Issue' },
  { id: '5', label: 'Product Expired' },
];

const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { orderId, orderNumber, isReturn = false } = route.params ?? {};
  const { showToast } = useToast();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [tempQty, setTempQty] = useState<string>('0');
  const [updating, setUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner states
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const lastScannedCodeRef = useRef<string | null>(null);

  // Return Metadata & Picker States
  const [isReturnMetaVisible, setIsReturnMetaVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'reason' | 'driver' | 'vehicle' | null>(null);
  const [metaSearchQuery, setMetaSearchQuery] = useState('');
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [tempReason, setTempReason] = useState<any>(null);
  const [tempDriver, setTempDriver] = useState<any>(null);
  const [tempVehicle, setTempVehicle] = useState<any>(null);

  useEffect(() => {
    loadOrderData();
    if (!hasPermission) requestPermission();
    if (isReturn) loadReturnMeta();
  }, [hasPermission]);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      const data = isReturn ? await fetchReturnItems(orderId) : await fetchOrderDetails(orderId);
      setOrderInfo(data);
      console.log('data is', data)
      const initialItems = (data.items || []).map((i: any) => ({
        ...i,
        picked_qty: isReturn ? (i.picked_qty || 0) : i.picked_qty,
      }));
      setItems(initialItems);
    } catch {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReturnMeta = async () => {
    try {
      const [dData, vData] = await Promise.all([fetchDrivers(), fetchVehicles()]);
      setDrivers(dData);
      setVehicles(vData);
    } catch {
      showToast('Meta sync failed', 'error');
    }
  };

  const filteredDrivers = useMemo(() => drivers.filter(d => d.full_name.toLowerCase().includes(metaSearchQuery.toLowerCase())), [drivers, metaSearchQuery]);
  const filteredVehicles = useMemo(() => vehicles.filter(v => v.vehicle_number.toLowerCase().includes(metaSearchQuery.toLowerCase())), [vehicles, metaSearchQuery]);

  const processBarcodeScan = (scannedValue: string) => {
    if (!scannedValue) return;
    const foundItem = items.find(i => i.barcode?.toLowerCase() === scannedValue.toLowerCase() || i.variant_sku?.toLowerCase() === scannedValue.toLowerCase());
    if (foundItem) {
      ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
      setSelectedItem(foundItem);
      setTempQty(foundItem.quantity.toString());
      setIsScannerVisible(false);
      lastScannedCodeRef.current = null;
      setSearchQuery('');
    } else {
      ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
      showToast('Item not found', 'error');
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39'],
    onCodeScanned: (codes: Code[]) => {
      const value = codes[0]?.value;
      if (value && isScannerVisible && value !== lastScannedCodeRef.current) {
        lastScannedCodeRef.current = value;
        processBarcodeScan(value);
      }
    },
  });

  const handleConfirmPicked = async () => {
    if (!selectedItem) return;
    const numericQty = parseInt(tempQty || '0', 10);
    if (isReturn) {
      setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, picked_qty: numericQty } : i));
      setSelectedItem(null);
      return;
    }
    setUpdating(true);
    try {
      const result = await updatePickedQuantity(orderId, selectedItem.id, numericQty);
      setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, picked_qty: result.picked_qty } : i));
      setSelectedItem(null);
      showToast('Updated', 'success');
    } catch {
      showToast('Failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async (orderId: any) => {
    setIsSubmitting(true);
    try {
      await generateOrderInvoice(orderId)
      showToast('Invoice Generated!', 'success');
     navigation.navigate('MainTabs', { screen: 'Orders' })
     
    } catch {
      showToast('Request failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitCreditNote = async () => {
    if (!tempReason || !tempDriver || !tempVehicle) return showToast('Please select all fields', 'warning');
    setIsReturnMetaVisible(false);
    setIsSubmitting(true);
    try {
      await collectReturnOrder(orderId, {
        items: items.filter(i => i.picked_qty > 0).map(i => ({ item_id: i.id, quantity: i.picked_qty })),
        reason: tempReason.label,
        agent_id: tempDriver.id,
        vehicle_id: tempVehicle.id,
      });
      showToast('Credit note requested', 'success');
      isReturn ? navigation.goBack() : navigation.navigate('MainTabs', { screen: 'Orders' })
     
    } catch {
      showToast('Request failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return searchQuery ? items.filter(i => i.product_name.toLowerCase().includes(q) || i.variant_sku.toLowerCase().includes(q) || i.barcode?.toLowerCase().includes(q)) : items;
  }, [searchQuery, items]);

  const pickedCount = items.filter(i => i.picked_qty > 0).length;

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={loading} transparent><View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#C62828" /></View></Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{orderNumber}</Text>
              {isReturn && <View style={styles.returnBadge}><Text style={styles.returnBadgeText}>RETURN</Text></View>}
            </View>
            <Text style={styles.headerSub}>{orderInfo?.status || 'Processing'}</Text>
        </View>

        <View style={styles.scanContainer}>
          <View style={styles.scanRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => setIsScannerVisible(true)}><Icon xml={SVG_ICONS.cameraIcon} /></TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput placeholder="Search/Scan Barcode..." placeholderTextColor="#94A3B8" style={styles.skuInput} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={() => processBarcodeScan(searchQuery)} />
            </View>
          </View>
        </View>

        <FlatList data={filteredItems} renderItem={({ item }) => (
          <TouchableOpacity style={[styles.itemCard, item.picked_qty === item.quantity ? styles.itemCardSuccess : (item.picked_qty > 0 ? styles.itemCardWarning : styles.itemCardPending)]} onPress={() => { setSelectedItem(item); setTempQty(item.picked_qty > 0 ? item.picked_qty.toString() : item.quantity.toString()); }}>
            <View style={styles.itemInfo}>
              <Text style={styles.skuText}>{item.barcode || item.variant_sku}</Text>
              <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
              <Text style={styles.qtyText}><Text style={styles.qtyBold}>{item.picked_qty}</Text> / {item.quantity}</Text>
            </View>
            <Icon xml={item.picked_qty === item.quantity ? SVG_ICONS.tickIcon : SVG_ICONS.editIcon} size={24} />
          </TouchableOpacity>
        )} keyExtractor={item => item.id} contentContainerStyle={styles.listPadding} />

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.invoiceBtn, pickedCount > 0 ? (isReturn ? styles.invoiceBtnReturn : styles.invoiceBtnActive) : styles.invoiceBtnDisabled]} onPress={() => isReturn ? setIsReturnMetaVisible(true) : handleGenerateInvoice(orderId)} disabled={pickedCount === 0 || isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.invoiceBtnText, pickedCount > 0 && { color: '#FFF' }]}>{isReturn ? `Request Credit Note (${pickedCount})` : `Generate Invoice (${pickedCount})`}</Text>}
          </TouchableOpacity>
        </View>

        {/* QUANTITY PICKER */}
        <Modal visible={!!selectedItem} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheetCard}>
              <Text style={styles.pickerTitle}>{selectedItem?.product_name}</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTempQty(prev => Math.max(0, parseInt(prev || '0') - 1).toString())}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
                <TextInput style={styles.counterInput} value={tempQty} onChangeText={v => setTempQty(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTempQty(prev => (parseInt(prev || '0') + 1).toString())}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedItem(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtnPrimary} onPress={handleConfirmPicked}>{updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirm</Text>}</TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* RETURN DETAILS BOTTOM SHEET */}
        <Modal visible={isReturnMetaVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.popupCard, { maxHeight: '80%' }]}>
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Return Details</Text>
                <TouchableOpacity onPress={() => setIsReturnMetaVisible(false)}>
                  <Icon xml={SVG_ICONS.closeIcon} size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="handled" 
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={styles.inputLabel}>RETURN REASON</Text>
                <View style={{ zIndex: 3000, marginBottom: 15 }}>
                  <TouchableOpacity 
                    style={[styles.inputBox, activePicker === 'reason' && styles.inputActive]} 
                    onPress={() => { setActivePicker(activePicker === 'reason' ? null : 'reason'); setMetaSearchQuery(''); }}
                  >
                    <Text style={styles.inputText}>{tempReason ? tempReason.label : 'Select Reason'}</Text>
                  </TouchableOpacity>
                  {activePicker === 'reason' && (
                    <View style={styles.floatingDropdown}>
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
                        {RETURN_REASONS.map(r => (
                          <TouchableOpacity key={r.id} style={styles.dropdownItem} onPress={() => { setTempReason(r); setActivePicker(null); }}>
                            <Text style={styles.dropdownItemText}>{r.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.inputLabel}>SELECT DRIVER</Text>
                <View style={{ zIndex: 2000, marginBottom: 15 }}>
                  <TouchableOpacity 
                    style={[styles.inputBox, activePicker === 'driver' && styles.inputActive]} 
                    onPress={() => { setActivePicker(activePicker === 'driver' ? null : 'driver'); setMetaSearchQuery(''); }}
                  >
                    <Text style={styles.inputText}>{tempDriver ? tempDriver.full_name : 'Select Driver'}</Text>
                  </TouchableOpacity>
                  {activePicker === 'driver' && (
                    <View style={styles.floatingDropdown}>
                      <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search..." 
                        placeholderTextColor="#94A3B8" 
                        value={metaSearchQuery} 
                        onChangeText={setMetaSearchQuery} 
                      />
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
                        {filteredDrivers.map(d => (
                          <TouchableOpacity key={d.id} style={styles.dropdownItem} onPress={() => { setTempDriver(d); if (d.vehicle) setTempVehicle(d.vehicle); setActivePicker(null); }}>
                            <Text style={styles.dropdownItemText}>{d.full_name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.inputLabel}>SELECT VEHICLE</Text>
                <View style={{ zIndex: 1000, marginBottom: 15 }}>
                  <TouchableOpacity 
                    style={[styles.inputBox, activePicker === 'vehicle' && styles.inputActive, tempDriver?.vehicle && { opacity: 0.6 }]} 
                    disabled={!!tempDriver?.vehicle} 
                    onPress={() => { setActivePicker(activePicker === 'vehicle' ? null : 'vehicle'); setMetaSearchQuery(''); }}
                  >
                    <Text style={styles.inputText}>{tempVehicle ? tempVehicle.vehicle_number : 'Select Vehicle'}</Text>
                  </TouchableOpacity>
                  {activePicker === 'vehicle' && (
                    <View style={styles.floatingDropdown}>
                      <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search..." 
                        placeholderTextColor="#94A3B8" 
                        value={metaSearchQuery} 
                        onChangeText={setMetaSearchQuery} 
                      />
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
                        {filteredVehicles.map(v => (
                          <TouchableOpacity key={v.id} style={styles.dropdownItem} onPress={() => { setTempVehicle(v); setActivePicker(null); }}>
                            <Text style={styles.dropdownItemText}>{v.vehicle_number}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.confirmBtnPrimary, { marginTop: 20 }, (!tempReason || !tempDriver || !tempVehicle) && { opacity: 0.5 }]} 
                  onPress={submitCreditNote} 
                  disabled={isSubmitting || !tempReason || !tempDriver || !tempVehicle}
                >
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={isScannerVisible} animationType="slide"><View style={styles.cameraOverlay}><Camera style={StyleSheet.absoluteFill} device={device!} isActive={isScannerVisible} codeScanner={codeScanner} /><TouchableOpacity style={styles.closeCamera} onPress={() => setIsScannerVisible(false)}><Text style={styles.closeCameraText}>Close Scanner</Text></TouchableOpacity></View></Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', marginTop: 2 },
  returnBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  returnBadgeText: { fontSize: 10, fontWeight: '900', color: '#C62828' },
  scanContainer: { backgroundColor: '#0F172A', margin: 16, borderRadius: 18, padding: 14 },
  scanRow: { flexDirection: 'row', gap: 10 },
  cameraBtn: { backgroundColor: '#334155', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  inputWrapper: { flex: 1, backgroundColor: '#334155', borderRadius: 12, paddingHorizontal: 12 },
  skuInput: { color: '#FFF', height: 48, fontWeight: '700' },
  listPadding: { padding: 16, paddingBottom: 100 },
  itemCard: { borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  itemCardSuccess: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  itemCardPending: { backgroundColor: '#FFF' },
  itemCardWarning: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  itemInfo: { flex: 1 },
  skuText: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  qtyText: { marginTop: 4, color: '#94A3B8' },
  qtyBold: { color: '#1E293B', fontSize: 18, fontWeight: '900' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  invoiceBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  invoiceBtnDisabled: { backgroundColor: '#F1F5F9' },
  invoiceBtnActive: { backgroundColor: '#C62828' },
  invoiceBtnReturn: { backgroundColor: '#7C3AED' },
  invoiceBtnText: { color: '#94A3B8', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetCard: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  pickerTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center', color: '#64748B', marginBottom: 15 },
  counterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 20 },
  counterBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  counterBtnText: { fontSize: 24, fontWeight: 'bold' },
  counterInput: { fontSize: 32, fontWeight: '900', color: '#C62828', textAlign: 'center', width: 80 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  confirmBtnPrimary: { flex: 2, backgroundColor: '#0F172A', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFF', fontWeight: 'bold' },
  cancelText: { color: '#64748B', fontWeight: 'bold' },
  popupCard: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 20 },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  popupTitle: { fontSize: 22, fontWeight: 'bold' },
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginBottom: 8, letterSpacing: 1 },
  inputBox: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 15, padding: 16, backgroundColor: '#F8FAFC' },
  inputActive: { borderColor: '#C62828' },
  inputText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  floatingDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1E293B', borderRadius: 12, marginTop: 4, zIndex: 9999, maxHeight: 180, padding: 10, elevation: 5 },
  searchInput: { backgroundColor: '#334155', borderRadius: 10, padding: 10, color: '#FFF', marginBottom: 10 },
  dropdownScroll: { maxHeight: 140 },
  dropdownItem: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  dropdownItemText: { color: '#FFF', fontWeight: '600' },
  cameraOverlay: { flex: 1, backgroundColor: '#000' },
  closeCamera: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  closeCameraText: { fontWeight: 'bold' },
});

export default OrderDetailsScreen;