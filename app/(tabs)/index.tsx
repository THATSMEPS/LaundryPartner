import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Bell, RefreshCw } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import OrderCard, { Order } from '@/components/OrderCard';

const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerName: 'Rajesh Kumar',
    phoneNumber: '+91 98765 43210',
    pickupAddress: 'A/203, Shela Garden, Ahmedabad',
    pickupDate: '2025-01-10',
    pickupTime: '10:00 AM',
    itemCount: '5 kg Wash & Fold',
    status: 'pending',
    totalAmount: 250,
  },
  {
    id: 'ORD002',
    customerName: 'Priya Sharma',
    phoneNumber: '+91 87654 32109',
    pickupAddress: 'B/105, Maple Heights, Shela',
    pickupDate: '2025-01-10',
    pickupTime: '2:00 PM',
    itemCount: '8 items Dry Clean',
    status: 'processing',
    totalAmount: 480,
  },
  {
    id: 'ORD003',
    customerName: 'Amit Patel',
    phoneNumber: '+91 76543 21098',
    pickupAddress: 'C/401, Green Valley, Near Shela',
    pickupDate: '2025-01-09',
    pickupTime: '4:30 PM',
    itemCount: '3 kg Premium Wash',
    status: 'dispatched',
    totalAmount: 180,
  },
];

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'dispatched'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => order.status === activeTab && (
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleApprove = (orderId: string) => {
    Alert.alert(
      'Approve Order',
      'Are you sure you want to approve this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setOrders(prev =>
              prev.map(order =>
                order.id === orderId ? { ...order, status: 'processing' } : order
              )
            );
            Alert.alert('Success', 'Order approved successfully!');
          },
        },
      ]
    );
  };

  const handleReject = (orderId: string) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setOrders(prev =>
              prev.map(order =>
                order.id === orderId ? { ...order, status: 'rejected' } : order
              )
            );
            Alert.alert('Success', 'Order rejected successfully!');
          },
        },
      ]
    );
  };

  const handleMarkReady = (orderId: string) => {
    Alert.alert(
      'Mark as Ready',
      'Mark this order as ready for dispatch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Ready',
          onPress: () => {
            setOrders(prev =>
              prev.map(order =>
                order.id === orderId ? { ...order, status: 'dispatched' } : order
              )
            );
            Alert.alert('Success', 'Order marked as ready for dispatch!');
          },
        },
      ]
    );
  };

  const handleMarkDelivered = (orderId: string) => {
    Alert.alert(
      'Mark as Delivered',
      'Confirm that this order has been delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delivered',
          onPress: () => {
            setOrders(prev =>
              prev.map(order =>
                order.id === orderId ? { ...order, status: 'delivered' } : order
              )
            );
            Alert.alert('Success', 'Order marked as delivered!');
          },
        },
      ]
    );
  };

  const handleCallCustomer = (phoneNumber: string) => {
    Alert.alert('Call Customer', `Call ${phoneNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log('Calling...') },
    ]);
  };

  const getTabCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  const renderTabButton = (
    tab: 'pending' | 'processing' | 'dispatched',
    title: string
  ) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
      {getTabCount(tab) > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{getTabCount(tab)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.businessName}>Clean & Fresh Laundry</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID or Customer Name"
          placeholderTextColor={theme.colors.textSecondary}
          onChangeText={(text) => setSearchQuery(text)}
          value={searchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('pending', 'Pending')}
        {renderTabButton('processing', 'Processing')}
        {renderTabButton('dispatched', 'Out for Delivery')}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkReady={handleMarkReady}
            onMarkDelivered={handleMarkDelivered}
            onCallCustomer={handleCallCustomer}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.success]}
            tintColor={theme.colors.success}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <RefreshCw size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No {activeTab} orders</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh and check for new orders
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  welcomeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  businessName: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  searchInput: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.success,
  },
  tabText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: theme.colors.white,
  },
  tabBadge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});