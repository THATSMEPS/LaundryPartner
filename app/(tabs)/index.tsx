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
import { getPartnerOrders, updateOrderStatus } from '@/utils/api';
// import { getPartnerOrders, updateOrderStatus } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_process' | 'out_for_delivery'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      fetchOrders();
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getPartnerOrders();
      setOrders(data.orders || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const handleApprove = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { status: 'confirmed' });
      fetchOrders();
      Alert.alert('Success', 'Order approved successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve order');
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { status: 'rejected' });
      fetchOrders();
      Alert.alert('Success', 'Order rejected successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reject order');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { status: 'ready_for_delivery' });
      fetchOrders();
      Alert.alert('Success', 'Order marked as ready for delivery!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to mark as ready');
    }
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
    tab: 'pending' | 'in_process' | 'out_for_delivery',
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 40}}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isAuthenticated === false) {
    // Not logged in, redirect to login
    setTimeout(() => {
      router.replace('/login');
    }, 100);
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 40}}>Redirecting to login...</Text>
      </SafeAreaView>
    );
  }

  const filteredOrders = orders.filter(order => order.status === activeTab && (
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  ));

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
        {renderTabButton('in_process', 'Processing')}
        {renderTabButton('out_for_delivery', 'Out for Delivery')}
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