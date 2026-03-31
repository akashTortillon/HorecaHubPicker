import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';
import {
  fetchReturnItems,
  fetchDrivers,
  fetchVehicles,
  collectReturnItems,
} from '../api/home/homeApi';
import {useToast} from '../utilities/ToastContext';

const REPORT_OPTIONS = [
  {id: 'package_damaged', name: 'Package Damaged'},
  {id: 'wrong_item', name: 'Wrong Item'},
  {id: 'quality_issue', name: 'Quality Issue'},
  {id: 'other', name: 'Other'},
];

const ReturnDetailsScreen = ({route, navigation}: any) => {
  const {orderId, clientName} = route.params || {};
  const {showToast} = useToast();

  // --- DATA STATES ---
  const [itemsData, setItemsData] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- FORM STATES ---
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<any>(REPORT_OPTIONS[1]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  // Modal Control
  const [pickerConfig, setPickerConfig] = useState<{visible: boolean, type: string, options: any[], title: string} | null>(null);

  useEffect(() => {
    loadDataSequentially();
  }, []);

  const loadDataSequentially = async () => {
    setLoading(true);
    try {
      const items = await fetchReturnItems(orderId);
      setItemsData(items);
      const driverData = await fetchDrivers();
      setDrivers(driverData || []);
      const vehicleData = await fetchVehicles();
      setVehicles(vehicleData || []);
    } catch (e) {
      console.log('Sync issue:', e);
    }
    setLoading(false);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelect = (item: any) => {
    if (pickerConfig?.type === 'reason') setSelectedReason(item);
    if (pickerConfig?.type === 'driver') {
        setSelectedDriver(item);
        if (item.vehicle) setSelectedVehicle(item.vehicle);
    }
    if (pickerConfig?.type === 'vehicle') setSelectedVehicle(item);
    setPickerConfig(null);
  };

  const handleConfirmCollection = async () => {
    if (selectedItems.length === 0) {
      showToast('Select at least one item', 'warning');
      return;
    }
    if (!selectedDriver || !selectedVehicle) {
      showToast('Select Agent and Vehicle', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      
      await collectReturnItems(orderId, {
        item_ids: selectedItems,
        reason: selectedReason.id,
        agent_id: selectedDriver.id,
        vehicle_id: selectedVehicle.id,
      });
      showToast('Return Processed Successfully', 'success');
      navigation.goBack();
    } catch (e) {
      showToast('Failed to collect items', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const CustomSelector = ({label, value, type, options, title}: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.inputBox}
        onPress={() => setPickerConfig({visible: true, type, options, title: title || label})}>
        <Text style={[styles.inputText, !value && {color: '#94A3B8'}]}>
          {value || `Select ${label}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Icon xml={SVG_ICONS.returnIcon} size={24} color="#C62828" />
          <Text style={styles.headerTitle}>Returns Hub</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeIconText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.orderNumberText}>{itemsData?.order_number || '---'}</Text>
          <Text style={styles.clientNameText}>{clientName}</Text>
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ITEMS TO COLLECT</Text>
            <Text style={styles.selectionCounter}>{selectedItems.length} Selected</Text>
          </View>

          {itemsData?.items?.map((item: any) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <TouchableOpacity 
                key={item.id} 
                activeOpacity={0.8}
                style={[styles.itemRow, isSelected && styles.itemRowActive]}
                onPress={() => toggleItemSelection(item.id)}>
                <View style={{flex: 1}}>
                  <Text style={styles.itemNameText}>{item.product_name}</Text>
                  <Text style={styles.itemQtyText}>Qty: {item.quantity}</Text>
                </View>
                <View style={[styles.statusCircle, isSelected && styles.statusCircleActive]}>
                  <Text style={styles.plusIcon}>{isSelected ? '✓' : '+'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <CustomSelector 
            label="PRIMARY REASON"
            value={selectedReason?.name}
            type="reason"
            options={REPORT_OPTIONS}
          />

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 12}}>
              <CustomSelector 
                label="COLLECTION AGENT"
                value={selectedDriver?.full_name}
                type="driver"
                options={drivers}
              />
            </View>
            <View style={{flex: 1}}>
              <CustomSelector 
                label="VEHICLE ID"
                value={selectedVehicle?.vehicle_number}
                type="vehicle"
                options={vehicles}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (selectedDriver && selectedVehicle && selectedItems.length > 0) && styles.submitBtnActive]}
            disabled={submitting || !selectedDriver || !selectedVehicle || selectedItems.length === 0}
            onPress={handleConfirmCollection}>
            {submitting ? <ActivityIndicator color="#94A3B8" /> : 
              <Text style={[styles.submitBtnText, (selectedDriver && selectedVehicle && selectedItems.length > 0) && {color: '#1E293B'}]}>
                Mark Collected (RMA Issue)
              </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- LIGHT THEME SELECTION MODAL --- */}
      <Modal visible={!!pickerConfig} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setPickerConfig(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{pickerConfig?.title}</Text>
                    <TouchableOpacity onPress={() => setPickerConfig(null)}>
                        <Text style={{color: '#64748B', fontWeight: 'bold'}}>Close</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                  data={pickerConfig?.options}
                  keyExtractor={(_, index) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => (
                    <TouchableOpacity 
                      style={styles.modalItem} 
                      onPress={() => handleSelect(item)}>
                      <Text style={styles.modalItemText}>
                          {item.name || item.full_name || item.vehicle_number}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#C62828" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  headerTitle: {fontSize: 20, fontWeight: '800', color: '#1E293B'},
  closeBtn: {backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center'},
  closeIconText: {fontSize: 14, color: '#64748B', fontWeight: 'bold'},
  scrollContent: {padding: 16},
  infoCard: {backgroundColor: '#111827', borderRadius: 28, padding: 24, marginBottom: 20},
  orderNumberText: {fontSize: 24, fontWeight: '900', color: '#FFF'},
  clientNameText: {fontSize: 14, color: '#94A3B8', marginTop: 4, marginBottom: 25},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15},
  sectionTitle: {fontSize: 11, fontWeight: '900', color: '#F87171', letterSpacing: 1},
  selectionCounter: {fontSize: 11, color: '#FFF', fontWeight: '700', opacity: 0.6},
  itemRow: {backgroundColor: '#1F2937', padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'transparent'},
  itemRowActive: {borderColor: '#4ADE80', backgroundColor: '#111827'},
  itemNameText: {color: '#FFF', fontSize: 16, fontWeight: '700'},
  itemQtyText: {color: '#6B7280', fontSize: 13, marginTop: 4},
  statusCircle: {width: 28, height: 28, borderRadius: 14, borderWeight: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center'},
  statusCircleActive: {backgroundColor: '#4ADE80', borderColor: '#4ADE80'},
  plusIcon: {color: '#FFF', fontSize: 18, fontWeight: '400'},
  formCard: {backgroundColor: '#FFF', borderRadius: 28, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10},
  inputContainer: {marginBottom: 18},
  inputLabel: {fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5},
  inputBox: {borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB'},
  inputText: {fontSize: 15, fontWeight: '700', color: '#1E293B'},
  row: {flexDirection: 'row'},
  submitBtn: {backgroundColor: '#F3F4F6', padding: 22, borderRadius: 22, marginTop: 10, alignItems: 'center'},
  submitBtnActive: {backgroundColor: '#E2E8F0'},
  submitBtnText: {color: '#94A3B8', fontWeight: '900', fontSize: 16},
  
  // --- Light Theme Modal ---
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 20, maxHeight: '80%', paddingHorizontal: 10},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'},
  modalTitle: {color: '#1E293B', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1},
  modalItem: {padding: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC'},
  modalItemText: {color: '#475569', fontWeight: '700', fontSize: 16},
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center'}
});

export default ReturnDetailsScreen;