import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, MapPin, Clock, Package } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from './Card';
import Button from './Button';

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTime: string;
  itemCount: string;
  status: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'rejected';
  totalAmount?: number;
}

interface OrderCardProps {
  order: Order;
  isDashboard?: boolean;
  onApprove?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  onCallCustomer?: (phoneNumber: string) => void;
}

export default function OrderCard({
  order,
  isDashboard = false,
  onApprove,
  onReject,
  onMarkReady,
  onMarkDelivered,
  onCallCustomer,
}: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'processing':
        return theme.colors.warning;
      case 'dispatched':
        return theme.colors.secondary;
      case 'delivered':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'processing':
        return 'In Progress';
      case 'dispatched':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <View style={styles.buttonContainer}>
            <Button
              title="Approve"
              onPress={() => onApprove?.(order.id)}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
            <Button
              title="Reject"
              onPress={() => onReject?.(order.id)}
              variant="danger"
              size="small"
              style={styles.actionButton}
            />
          </View>
        );
      case 'processing':
        return (
        <Button
          title="Mark as Ready for Dispatch"
          onPress={() => onMarkReady?.(order.id)}
          variant="primary"
          size="small"
          style={isDashboard ? styles.dashboardButton : undefined}
        />
        );
      case 'dispatched':
        return (
        <Button
          title="Mark as Delivered"
          onPress={() => onMarkDelivered?.(order.id)}
          variant="primary"
          size="small"
          style={isDashboard ? styles.dashboardButton : undefined}
        />
        );
      default:
        return null;
    }
  };

  return (
    <Card elevation="md" style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.customerName, isDashboard && styles.dashboardCustomerName]}>{order.customerName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
          <Text style={[styles.statusText, isDashboard && styles.dashboardStatusText]}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <Text style={[styles.orderId, isDashboard && styles.dashboardOrderId]}>#{order.id}</Text>

      <View style={styles.detailRow}>
        <MapPin size={16} color={theme.colors.textSecondary} />
        <Text style={styles.detailText}>{order.pickupAddress}</Text>
      </View>

      <View style={styles.detailRow}>
        <Clock size={16} color={theme.colors.textSecondary} />
        <Text style={styles.detailText}>
          {order.pickupDate} at {order.pickupTime}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Package size={16} color={theme.colors.textSecondary} />
        <Text style={styles.detailText}>{order.itemCount}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.phoneButton}
          onPress={() => onCallCustomer?.(order.phoneNumber)}
        >
          <Phone size={16} color={theme.colors.primary} />
          <Text style={styles.phoneText}>{order.phoneNumber}</Text>
        </TouchableOpacity>

        {renderActionButtons()}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderId: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  customerName: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  phoneText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  dashboardCustomerName: {
    color: theme.colors.success,
    ...theme.typography.h3,
    fontWeight: 'bold',
  },
  dashboardOrderId: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  dashboardButton: {
    flexShrink: 1,
    flexGrow: 0,
    flexBasis: 'auto',
    paddingHorizontal: theme.spacing.sm,
  },
  dashboardStatusText: {
    flexWrap: 'wrap',
    // React Native does not support word-break, but flexWrap helps with wrapping at word boundaries
  },
});
