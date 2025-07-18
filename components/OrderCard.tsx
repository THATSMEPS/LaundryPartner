import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, MapPin, Clock, Package } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from './Card';
import Button from './Button';

export interface Order {
  id: string;
  fullId?: string; // Keep full ID for API calls
  customerId: string;
  customerName: string;
  phoneNumber: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTime: string;
  itemCount: string;
  status: 'pending' | 'confirmed' | 'pickup_scheduled' | 'picked_up' | 'in_process' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'rejected' | 'failed';
  paymentType?: 'COD' | 'ONLINE';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount?: number;
  gst?: number;
  deliveryFee?: number;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  distance?: number;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  itemsAmount?: number;
}

interface OrderCardProps {
  order: Order;
  isDashboard?: boolean;
  onApprove?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onDispatchForDelivery?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  onCallCustomer?: (phoneNumber: string) => void;
}

export default function OrderCard({
  order,
  isDashboard = false,
  onApprove,
  onReject,
  onMarkReady,
  onDispatchForDelivery,
  onMarkDelivered,
  onCallCustomer,
}: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.primary;
      case 'confirmed':
        return theme.colors.primary;
      case 'pickup_scheduled':
        return theme.colors.primary;
      case 'picked_up':
        return theme.colors.primary;
      case 'in_process':
        return theme.colors.primary;
      case 'ready_for_delivery':
        return theme.colors.secondary;
      case 'out_for_delivery':
        return theme.colors.secondary;
      case 'delivered':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'confirmed':
        return 'Confirmed';
      case 'pickup_scheduled':
        return 'Pickup Scheduled';
      case 'picked_up':
        return 'Picked Up';
      case 'in_process':
        return 'In Process';
      case 'ready_for_delivery':
        return 'Ready for Delivery';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'rejected':
        return 'Rejected';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const renderActionButtons = () => {
    const actionId = order.fullId || order.id; // Use fullId for API calls, fallback to id
    
    switch (order.status) {
      case 'pending':
        return (
          <View style={styles.buttonContainer}>
            <Button
              title="Approve"
              onPress={() => onApprove?.(actionId)}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
            <Button
              title="Reject"
              onPress={() => onReject?.(actionId)}
              variant="danger"
              size="small"
              style={styles.actionButton}
            />
          </View>
        );
      case 'confirmed':
      case 'pickup_scheduled':
      case 'picked_up':
        return (
          <View style={styles.statusContainer}>
            <View style={[styles.statusInfoBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusInfoText}>{getStatusText(order.status)}</Text>
            </View>
            <Text style={styles.statusDescription}>
              {order.status === 'confirmed' ? 'Order confirmed. Waiting for pickup scheduling.' :
               order.status === 'pickup_scheduled' ? 'Pickup scheduled. Delivery partner will collect soon.' :
               'Order collected by delivery partner. Will be delivered to you shortly.'}
            </Text>
          </View>
        );
      case 'in_process':
        return (
        <Button
          title="Mark as Ready for Delivery"
          onPress={() => onMarkReady?.(actionId)}
          variant="primary"
          size="small"
          style={isDashboard ? styles.dashboardButton : undefined}
        />
        );
      case 'ready_for_delivery':
        return (
        <Button
          title="Dispatch for Delivery"
          onPress={() => onDispatchForDelivery?.(actionId)}
          variant="primary"
          size="small"
          style={isDashboard ? styles.dashboardButton : undefined}
        />
        );
      case 'out_for_delivery':
        return (
        <Button
          title="Mark as Delivered"
          onPress={() => onMarkDelivered?.(actionId)}
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
        <Text style={[styles.customerName, isDashboard && styles.dashboardCustomerName]}>
          {order.customerName || 'Unknown Customer'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={[styles.statusText, isDashboard && styles.dashboardStatusText]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.orderId, isDashboard && styles.dashboardOrderId]}>#{order.id || 'N/A'}</Text>

      <View style={styles.detailRow}>
        <MapPin size={16} color={theme.colors.textSecondary} />
        <Text style={styles.detailText}>{order.pickupAddress || 'No address provided'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Clock size={16} color={theme.colors.textSecondary} />
        <Text style={styles.detailText}>
          {order.pickupDate || 'TBD'} at {order.pickupTime || 'TBD'}
        </Text>
      </View>

      {/* Order Items Section */}
      <View style={styles.itemsSection}>
        <View style={styles.itemsHeader}>
          <Package size={16} color={theme.colors.textSecondary} />
          <Text style={styles.itemsHeaderText}>Order Items</Text>
        </View>
        {order.items && order.items.length > 0 ? (
          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={item.id || index} style={[
                styles.itemRow,
                index === order.items!.length - 1 && styles.lastItemRow
              ]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity || '0'}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(item.price || 0).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Items Total:</Text>
                <Text style={styles.totalValue}>₹{(order.itemsAmount || 0).toFixed(2)}</Text>
              </View>
              {order.gst && order.gst > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST:</Text>
                  <Text style={styles.totalValue}>₹{order.gst.toFixed(2)}</Text>
                </View>
              ) : null}
              {order.deliveryFee && order.deliveryFee > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Delivery Fee:</Text>
                  <Text style={styles.totalValue}>₹{order.deliveryFee.toFixed(2)}</Text>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total Amount:</Text>
                <Text style={styles.grandTotalValue}>₹{(order.totalAmount || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.noItemsText}>No items available</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.phoneButton}
          onPress={() => onCallCustomer?.(order.phoneNumber || '')}
        >
          <Phone size={16} color={theme.colors.primary} />
          <Text style={styles.phoneText}>{order.phoneNumber || 'No phone'}</Text>
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
  // Items section styles
  itemsSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  itemsHeaderText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  itemsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  itemQuantity: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  totalSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  totalLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  grandTotalRow: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  grandTotalLabel: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  grandTotalValue: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  noItemsText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  statusContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  statusInfoBadge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  statusInfoText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  statusDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
