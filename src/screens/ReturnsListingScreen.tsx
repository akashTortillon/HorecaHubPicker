import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';

const DATA = [{id: '1', orderId: 'ORD-2026-999', client: 'Vikas Enterprises'}];

const ReturnsListingScreen = ({navigation}) => {
  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReturnsDetail', {item})}>
      <View>
        <Text style={styles.orderId}>{item.orderId}</Text>
        <Text style={styles.clientName}>{item.client}</Text>
      </View>
      <Text style={styles.chevron}>〉</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon xml={SVG_ICONS.returnIcon} size={28} color="#C62828" />
        <Text style={styles.headerTitle}>Returns Hub</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          DELIVERED ORDERS (COLLECT ITEMS)
        </Text>
        <FlatList
          data={DATA}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12},
  headerTitle: {fontSize: 24, fontWeight: '800', color: '#1E293B'},
  headerText: {fontSize: 24, fontWeight: 'bold', color: '#1E293B'},
  content: {paddingHorizontal: 20},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  orderId: {fontSize: 20, fontWeight: '900', color: '#1E293B'},
  clientName: {fontSize: 16, color: '#64748B', marginTop: 4, fontWeight: '600'},
  chevron: {fontSize: 20, color: '#94A3B8'},
});

export default ReturnsListingScreen;
