import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  FlatList,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import {
  fetchInvoices,
  getDownloadUrl,
  fetchDrivers,
  fetchVehicles,
  assignDispatch,
} from '../api/home/homeApi';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../utilities/ToastContext';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import { formatDateTime } from '../utilities/Functions';

interface Invoice {
  id: string;
  invoice_number: string;
  order_number: string;
  customer_name?: string;
  order_date?: string;
  driver_name?: string | null;
  vehicle_number?: string | null;
}

const InvoiceScreen = () => {
  const { showToast } = useToast();
  const token = useAuthStore((state) => state.token);

  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Selection States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [tempDriver, setTempDriver] = useState<any>(null);
  const [tempVehicle, setTempVehicle] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [invData, driverData, vehicleData] = await Promise.all([
        fetchInvoices(),
        fetchDrivers(),
        fetchVehicles(),
      ]);
      setInvoices(invData);
      setDrivers(driverData);
      setVehicles(vehicleData);
    } catch (error) {
      showToast('Failed to sync data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedInvoice || !tempDriver || !tempVehicle) return;
    setIsAssigning(true);
    try {
      await assignDispatch(selectedInvoice.id, tempDriver.id, tempVehicle.id);
      showToast('Dispatch Assigned Successfully', 'success');
      
      // Update local state to show as assigned immediately
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? { ...inv, driver_name: tempDriver.full_name, vehicle_number: tempVehicle.vehicle_number }
            : inv
        )
      );
      setSheetVisible(false);
    } catch (error) {
      showToast('Assignment failed', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDownload = async (item: Invoice) => {
    const url = getDownloadUrl(item.id);
    const fileName = `Invoice_${item.invoice_number}.pdf`;
    let path = Platform.OS === 'ios' 
      ? `${RNFS.DocumentDirectoryPath}/${fileName}` 
      : `${RNFS.DownloadDirectoryPath}/${fileName}`;

    try {
      showToast('Starting download...', 'warning');
      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: path,
        headers: { Authorization: `Bearer ${token}` },
      }).promise;

      if (result.statusCode === 200) {
        showToast('Saved to folder', 'success');
        if (Platform.OS === 'ios') ReactNativeBlobUtil.ios.previewDocument(path);
      }
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardTopRow}>
        <View style={styles.headerTextSection}>
          <Text style={styles.invoiceId}>{item.invoice_number}</Text>
          <Text style={styles.refText}>ORD: {item.order_number}</Text>
          <Text style={styles.refText}>Customer: {item?.customer_name}</Text>
          <Text style={styles.refText}>{formatDateTime(item?.order_date)}</Text>
        </View>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
          <Icon xml={SVG_ICONS.downloadIcon} size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {item.driver_name ? (
        <View style={styles.assignedBadge}>
          <Icon xml={SVG_ICONS.tickIcon} size={18} color="#FFF" />
          <Text style={styles.assignedText}>{item.driver_name} • {item.vehicle_number}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => {
            setSelectedInvoice(item);
            setTempDriver(null);
            setTempVehicle(null);
            setSheetVisible(true);
          }}
        >
          <Icon xml={SVG_ICONS.truckIcon} color="#FFF" size={20} />
          <Text style={styles.assignBtnText}>Assign Dispatch</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon xml={SVG_ICONS.invoice} color="#C62828" size={28} />
        <Text style={styles.headerTitle}>Invoice List</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#C62828" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}
        />
      )}

      <Modal visible={sheetVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Assign Dispatch</Text>
              <TouchableOpacity onPress={() => setSheetVisible(false)}>
                <Icon xml={SVG_ICONS.closeIcon} size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* DRIVER DROPDOWN */}
            <Text style={styles.inputLabel}>SELECT DRIVER</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              containerStyle={styles.dropdownListContainer}
              itemTextStyle={styles.itemTextStyle}
              activeColor="#334155"
              data={drivers}
              search
              maxHeight={250}
              labelField="full_name"
              valueField="id"
              placeholder="Select Driver"
              searchPlaceholder="Search Name..."
              value={tempDriver}
              onChange={(item) => {
                setTempDriver(item);
                // Auto-fill vehicle if driver has one assigned
                if (item.vehicle) setTempVehicle(item.vehicle);
              }}
            />

            {/* VEHICLE DROPDOWN */}
            <Text style={[styles.inputLabel, { marginTop: 15 }]}>SELECT VEHICLE</Text>
            <Dropdown
              style={[styles.dropdown, !!tempDriver?.vehicle && { opacity: 0.6 }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              containerStyle={styles.dropdownListContainer}
              itemTextStyle={styles.itemTextStyle}
              activeColor="#334155"
              data={vehicles}
              search
              maxHeight={250}
              labelField="vehicle_number"
              valueField="id"
              placeholder="Select Vehicle"
              searchPlaceholder="Search Number..."
              value={tempVehicle}
              disable={!!tempDriver?.vehicle}
              onChange={(item) => setTempVehicle(item)}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, (!tempDriver || !tempVehicle || isAssigning) && { opacity: 0.5 }]}
              onPress={handleConfirmAssignment}
              disabled={!tempDriver || !tempVehicle || isAssigning}
            >
              {isAssigning ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Finalize Dispatch</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  
  // Card Styles
  cardContainer: { backgroundColor: '#EEF2FF', borderRadius: 25, padding: 20, marginBottom: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerTextSection: { flex: 1 },
  invoiceId: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  refText: { fontSize: 13, color: '#64748B', fontWeight: 'bold' },
  downloadBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 50, height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
  
  // Action Buttons
  assignBtn: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 18, gap: 10, marginTop: 10 },
  assignBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  assignedBadge: { backgroundColor: '#439F48', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, gap: 8, marginTop: 10 },
  assignedText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  popupCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, elevation: 5 },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  popupTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  
  // Dropdown Styles (Library specific)
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginBottom: 8 },
  dropdown: {
    height: 55,
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  dropdownListContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 0,
    overflow: 'hidden',
  },
  placeholderStyle: { fontSize: 15, color: '#94A3B8', fontWeight: '700' },
  selectedTextStyle: { fontSize: 15, color: '#1E293B', fontWeight: '700' },
  inputSearchStyle: { height: 45, fontSize: 14, backgroundColor: '#334155', color: '#FFF', borderRadius: 10 },
  itemTextStyle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  // Confirm Button
  confirmBtn: { backgroundColor: '#C62828', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default InvoiceScreen;