import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const ReturnDetailsScreen = ({route, navigation}) => {
  const {item} = route.params;
  const [reason, setReason] = useState('Damaged');
  const [agent, setAgent] = useState('Agent');
  const [vehicle, setVehicle] = useState('Vehicle');

  // Simulated dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null);

  const Dropdown = ({label, value, options, onSelect, type}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, activeDropdown === type && styles.inputActive]}
        onPress={() =>
          setActiveDropdown(activeDropdown === type ? null : type)
        }>
        <Text style={styles.inputText}>{value}</Text>
      </TouchableOpacity>

      {activeDropdown === type && (
        <View style={styles.dropdownMenu}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(opt);
                setActiveDropdown(null);
              }}>
              <Text style={styles.dropdownItemText}>
                {opt === value ? `✓ ${opt}` : opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Returns Hub</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.orderIdText}>{item.orderId}</Text>
          <Text style={styles.clientText}>{item.client}</Text>
          <Text style={styles.itemsTitle}>ITEMS TO COLLECT</Text>
          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemName}>USB-C Cable 2m</Text>
              <Text style={styles.itemQty}>Qty: 20</Text>
            </View>
            <Text style={styles.addIcon}>+</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Dropdown
            label="PRIMARY REASON"
            value={reason}
            type="reason"
            options={['Damaged', 'Wrong Item', 'Replacement', 'Quality Issue']}
            onSelect={setReason}
          />

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
              <Dropdown
                label="COLLECTION AGENT"
                value={agent}
                type="agent"
                options={['Rajesh Kumar', 'Amit Singh', 'Suresh Patel']}
                onSelect={setAgent}
              />
            </View>
            <View style={{flex: 1}}>
              <Dropdown
                label="VEHICLE ID"
                value={vehicle}
                type="vehicle"
                options={[
                  'DL 1V 1234 (Tata Ace)',
                  'UP 16 Z 9876 (Bolero)',
                  'HR 26 AB 4567 (Eicher)',
                ]}
                onSelect={setVehicle}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            disabled={agent === 'Agent' || vehicle === 'Vehicle'}>
            <Text style={styles.submitText}>Mark Collected (RMA Issue)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {fontSize: 24, fontWeight: 'bold', color: '#1E293B'},
  closeBtn: {backgroundColor: '#F1F5F9', padding: 8, borderRadius: 20},
  closeIcon: {fontSize: 18, color: '#64748B'},
  scrollContent: {padding: 15},
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 32,
    padding: 25,
    marginBottom: 20,
  },
  orderIdText: {fontSize: 24, fontWeight: '900', color: '#FFF'},
  clientText: {color: '#94A3B8', fontSize: 16, marginBottom: 20},
  itemsTitle: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 15,
  },
  itemRow: {
    backgroundColor: '#2D3748',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {color: '#FFF', fontSize: 18, fontWeight: '700'},
  itemQty: {color: '#94A3B8', fontSize: 14, marginTop: 4},
  addIcon: {color: '#FFF', fontSize: 24},
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 20,
    elevation: 2,
  },
  inputContainer: {marginBottom: 15, zIndex: 10},
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#F9FAFB',
  },
  inputActive: {borderColor: '#3B82F6'},
  inputText: {fontSize: 16, fontWeight: '700', color: '#1E293B'},
  row: {flexDirection: 'row'},
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#4A5568',
    borderRadius: 12,
    marginTop: 5,
    zIndex: 100,
    paddingVertical: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#718096',
  },
  dropdownItemText: {color: '#FFF', fontWeight: '600'},
  submitBtn: {
    backgroundColor: '#F1F5F9',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  submitText: {color: '#94A3B8', fontWeight: '800', fontSize: 16},
});

export default ReturnDetailsScreen;
