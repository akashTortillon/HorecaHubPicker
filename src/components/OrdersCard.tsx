import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';

interface OrdersCardProps {
  orderId: string;
  clientName: string;
  status: string;
  backgroundColor?: string;
  borderColor?: string;
  statusColor?: string;
  onPress:()=> void ;
}

const OrdersCard: React.FC<OrdersCardProps> = ({
  orderId,
  clientName,
  status,
  backgroundColor = '#EBF2FF',
  borderColor = '#D1E3FF',
  statusColor = '#1E293B',
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.activityCard, {backgroundColor, borderColor}]}>
      {/* 1. Added flex: 1 wrapper to allow info to shrink */}
      <View style={styles.activityInfo}>
        <Text style={styles.orderId} numberOfLines={1}>
          {orderId}
        </Text>
        <Text style={styles.clientName} numberOfLines={1}>
          {clientName}
        </Text>
      </View>

      {/* 2. Kept the badge outside the flexible view so it stays its fixed size */}
      <View style={styles.pendingBadge}>
        <Text style={[styles.pendingText, {color: statusColor}]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activityCard: {
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    marginVertical: 8,
    // Ensure the card itself doesn't exceed parent width
    width: '100%',
  },
  activityInfo: {
    gap: 4,
    flex: 1, // CRITICAL: Takes up available space and prevents overflow
    marginRight: 10, // Adds space between text and the badge
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  clientName: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    flexShrink: 0, // Prevents the badge from squishing
  },
  pendingText: {
    fontWeight: '800',
    fontSize: 13,
  },
});

export default OrdersCard