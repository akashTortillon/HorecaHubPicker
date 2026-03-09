import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import Icon from '../utilities/Icon';
import {SVG_ICONS} from '../assets/icons/svg';
import {
  fetchInvoices,
  getDownloadUrl,
  assignDispatch,
  fetchDrivers,
  fetchVehicles,
} from '../api/home/homeApi';
import {useAuthStore} from '../store/useAuthStore';
import {useToast} from '../utilities/ToastContext';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import {Platform} from 'react-native';

const {width} = Dimensions.get('window');

interface Invoice {
  id: string;
  invoice_number: string;
  order_number: string;
  driver_name?: string | null;
  vehicle_number?: string | null;
  generated_at: string;
}

const InvoiceScreen = () => {
  const {showToast} = useToast();
  const token = useAuthStore(state => state.token);

  // --- STATE ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Form State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activePicker, setActivePicker] = useState<'driver' | 'vehicle' | null>(
    null,
  );
  const [tempDriver, setTempDriver] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [invData, driverData] = await Promise.all([
        fetchInvoices(),
        fetchDrivers(),
      ]);
      setInvoices(invData);
      setDrivers(driverData);
    } catch (error) {
      showToast('Failed to sync data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedInvoice || !tempDriver) return;

    setIsAssigning(true);
    try {
      await assignDispatch(selectedInvoice.id, tempDriver.id);

      showToast('Dispatch Assigned', 'success');

      setInvoices(prev =>
        prev.map(inv =>
          inv.id === selectedInvoice.id
            ? {
                ...inv,
                driver_name: tempDriver.full_name,
                vehicle_number: tempDriver.vehicle_registration,
              }
            : inv,
        ),
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

    let downloadPath: string;
    let locationMessage: string;

    if (Platform.OS === 'ios') {
      downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      locationMessage = `Saved to Documents folder: ${fileName}`;
    } else {
      downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      locationMessage = `Saved to Downloads folder: ${fileName}`;
    }

    try {
      showToast('Starting download...', 'warning');

      const ret = RNFS.downloadFile({
        fromUrl: url,
        toFile: downloadPath,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf, application/json, */*',
        },
        background: true,
        discretionary: true,
        progressDivider: 5,
      }).promise;

      const result = await ret;

      if (result.statusCode === 200) {
        if (Platform.OS !== 'ios') {
          await ReactNativeBlobUtil.fs.scanFile([
            {path: downloadPath, mime: 'application/pdf'},
          ]);
        }

        showToast(locationMessage, 'success');

        try {
          if (Platform.OS === 'ios') {
            ReactNativeBlobUtil.ios.previewDocument(downloadPath);
          } else {
            const fileUri = `file://${downloadPath}`;
            const supported = await Linking.canOpenURL(fileUri);
            if (supported) {
              await Linking.openURL(fileUri);
            } else {
              showToast('Downloaded, but no PDF viewer found', 'warning');
            }
          }
        } catch (openErr) {
          showToast('Downloaded successfully – open from folder', 'warning');
        }
      } else {
        throw new Error(`Server returned ${result.statusCode}`);
      }
    } catch (err: any) {
      showToast(`Failed: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const renderInvoiceCard = ({item}: {item: Invoice}) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardTopRow}>
        <View style={styles.headerTextSection}>
          <Text style={styles.invoiceId} numberOfLines={1}>
            {item.invoice_number}
          </Text>
          <Text style={styles.refText} numberOfLines={1}>
            ORD: {item.order_number}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => handleDownload(item)}>
          <Icon xml={SVG_ICONS.downloadIcon} size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {item.driver_name ? (
        <View style={styles.assignedBadge}>
          <Icon xml={SVG_ICONS.tickIcon} size={18} />
          <View style={styles.textWrapper}>
            <Text
              style={styles.assignedText}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.driver_name} • {item.vehicle_number}
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => {
            setSelectedInvoice(item);
            setTempDriver(null);
            setSheetVisible(true);
          }}>
          <Icon xml={SVG_ICONS.truckIcon} />
          <Text style={styles.assignBtnText} numberOfLines={1}>
            Assign Driver & Vehicle
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon xml={SVG_ICONS.invoice} color="#C62828" />
        <Text style={styles.headerTitle}>Invoice List</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#C62828"
          style={{marginTop: 50}}
        />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceCard}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 16}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadInitialData}
            />
          }
        />
      )}

      {/* ASSIGN DISPATCH MODAL */}
      <Modal visible={sheetVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Assign Dispatch</Text>
              <TouchableOpacity onPress={() => setSheetVisible(false)}>
                <Icon xml={SVG_ICONS.closeIcon} size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>SELECT DRIVER</Text>
            <View style={{zIndex: 10}}>
              <TouchableOpacity
                style={[
                  styles.inputBox,
                  activePicker === 'driver' && styles.inputActive,
                ]}
                onPress={() =>
                  setActivePicker(activePicker === 'driver' ? null : 'driver')
                }>
                <Text style={styles.inputText} numberOfLines={1}>
                  {tempDriver
                    ? `${tempDriver.full_name}-${tempDriver.vehicle_registration}`
                    : 'Select Driver'}
                </Text>
              </TouchableOpacity>
              {activePicker === 'driver' && (
                <View style={styles.floatingDropdown}>
                  <ScrollView nestedScrollEnabled style={{maxHeight: 200}}>
                    {drivers.map(d => (
                      <TouchableOpacity
                        key={d.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setTempDriver(d);
                          setActivePicker(null);
                        }}>
                        <Text style={styles.dropdownItemText}>
                          {d.full_name}-{d.vehicle_registration}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!tempDriver || isAssigning) && {
                  opacity: 0.5,
                },
              ]}
              onPress={handleConfirmAssignment}
              disabled={!tempDriver || isAssigning}>
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
  container: {flex: 1, backgroundColor: '#FFF'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 20, gap: 10},
  headerTitle: {fontSize: 24, fontWeight: 'bold', color: '#1E293B'},
  cardContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 25,
    padding: 20, // Reduced slightly for better mobile fit
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    width: '100%', // Ensure it respects parent container
    alignSelf: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  headerTextSection: {
    flex: 1, // Allows text to truncate before hitting download button
  },
  invoiceId: {fontSize: 20, fontWeight: '900', color: '#1E293B'},
  refText: {fontSize: 13, color: '#64748B', fontWeight: 'bold'},
  downloadBtn: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  assignBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 10,
  },
  assignBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  assignedBadge: {
    backgroundColor: '#439F48',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 8,
    width: '100%',
  },
  textWrapper: {
    flex: 1,
  },
  assignedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  popupCard: {backgroundColor: '#FFF', borderRadius: 30, padding: 25},
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  popupTitle: {fontSize: 22, fontWeight: 'bold'},
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  inputActive: {borderColor: '#D32F2F'},
  inputText: {fontSize: 15, fontWeight: '700', color: '#1E293B'},
  floatingDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginTop: 4,
    elevation: 5,
    zIndex: 999,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
  },
  dropdownItemText: {color: '#FFF', fontWeight: '600', fontSize: 14},
  confirmBtn: {
    backgroundColor: '#D32F2F',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
    height: 60,
    justifyContent: 'center',
  },
  confirmBtnText: {color: '#FFF', fontWeight: 'bold', fontSize: 16},
});

export default InvoiceScreen;
