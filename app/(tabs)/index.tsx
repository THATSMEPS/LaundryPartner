import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { FlatList as RNFlatList } from 'react-native';
import { RefreshCw, Search, Star, TrendingUp, Power } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import OrderCard, { Order } from '@/components/OrderCard';
import { getPartnerOrders, updateOrderStatus, updatePartnerStatus } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_process' | 'ready_for_delivery'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [partnerName, setPartnerName] = useState('Partner');
  const [isOpen, setisOpen] = useState(true);
  const scrollY = new Animated.Value(0);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchBarHeight, setSearchBarHeight] = useState(0);
  
  // Get screen width for responsive design
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    checkAuth();
  }, []);

  // Log token from storage on dashboard load
  useEffect(() => {
    const logToken = async () => {
      const token = await AsyncStorage.getItem('token');
      // console.log('Token from storage on dashboard:', token);
    };
    logToken();
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      // Get partner name from storage
      const partner = await AsyncStorage.getItem('partner');
      if (partner) {
        try {
          const partnerData = JSON.parse(partner);
          setPartnerName(partnerData.name || 'Partner');
        } catch (e) {
          setPartnerName('Partner');
        }
      }
      fetchOrders();
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getPartnerOrders();
      // Backend returns: { success: true, message: "...", data: { orders: [...] } }
      const backendOrders = response.data?.orders || response.orders || [];
      
      // Map backend order structure to frontend Order interface
      const mappedOrders = backendOrders.map((order: any) => ({
        id: order.id?.includes('-') ? order.id.split('-')[0] : (order.id || 'N/A'), // Truncate ID at first hyphen
        fullId: order.id || '', // Keep full ID for API calls
        customerId: order.customerId || '',
        customerName: order.customer?.name || 'Unknown',
        phoneNumber: order.customer?.mobile || '',
        pickupAddress: `${order.address?.pickup?.street || ''}, ${order.address?.pickup?.landmark || ''}, ${order.address?.pickup?.city || ''}`.trim() || 'No address',
        pickupDate: order.placedAt ? new Date(order.placedAt).toLocaleDateString() : '',
        pickupTime: order.placedAt ? new Date(order.placedAt).toLocaleTimeString() : '',
        itemCount: `${order.items?.length || 0} items`,
        status: order.status || 'pending',
        paymentType: order.paymentType || 'COD',
        paymentStatus: order.paymentStatus || 'pending',
        totalAmount: parseFloat(order.totalAmount || '0'),
        gst: parseFloat(order.gst || '0'),
        deliveryFee: parseFloat(order.deliveryFee || '0'),
        deliveryPartnerId: order.deliveryPartnerId || '',
        distance: parseFloat(order.distance || '0'),
        items: order.items?.map((item: any) => ({
          id: item.id || '',
          name: item.laundryItem?.name || item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: parseFloat(item.price || item.laundryItem?.price || '0'),
        })) || [],
        itemsAmount: parseFloat(order.itemsAmount || '0'),
      }));
      
      setOrders(mappedOrders);
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

  const handleDispatchForDelivery = async (orderId: string) => {
    Alert.alert(
      'Dispatch for Delivery',
      'Confirm that this order is ready to be dispatched for delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, { status: 'out_for_delivery' });
              fetchOrders();
              Alert.alert('Success', 'Order dispatched for delivery!');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to dispatch order');
            }
          },
        },
      ]
    );
  };

  const handleMarkDelivered = async (orderId: string) => {
    Alert.alert(
      'Mark as Delivered',
      'Confirm that this order has been delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delivered',
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, { status: 'delivered' });
              fetchOrders();
              Alert.alert('Success', 'Order marked as delivered!');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to mark as delivered');
            }
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

  const togglePartnerStatus = async () => {
    try {
      const newStatus = !isOpen;
      await updatePartnerStatus({ isOpen: newStatus });
      setisOpen(newStatus);
      Alert.alert(
        'Status Updated',
        `You are now ${newStatus ? 'online' : 'offline'}`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update status');
    }
  };

  const getTabCount = (status: string) => {
    if (status === 'pending') {
      // Include both pending and confirmed orders in pending tab
      return orders.filter(order => 
        order.status === 'pending' || 
        order.status === 'confirmed' || 
        order.status === 'pickup_scheduled' || 
        order.status === 'picked_up'
      ).length;
    }
    return orders.filter(order => order.status === status).length;
  };

  const renderTabButton = (
    tab: 'pending' | 'in_process' | 'ready_for_delivery',
    title: string
  ) => {
    const count = getTabCount(tab);
    const isActive = activeTab === tab;
    
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          isActive && styles.activeTab,
          { minWidth: screenWidth * 0.28 } // Responsive width
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text 
          style={[
            styles.tabText, 
            isActive && styles.activeTabText,
            { fontSize: screenWidth < 350 ? 12 : 14 } // Responsive font size
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
        {count > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 40}}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isAuthenticated === false) {
    // Not logged in, redirect to login
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 40}}>Redirecting to login...</Text>
      </SafeAreaView>
    );
  }

  const filteredOrders = orders.filter(order => {
    let shouldInclude = false;
    
    if (activeTab === 'pending') {
      // Include pending, confirmed, pickup_scheduled, and picked_up orders in pending tab
      shouldInclude = ['pending', 'confirmed', 'pickup_scheduled', 'picked_up'].includes(order.status);
    } else {
      shouldInclude = order.status === activeTab;
    }
    
    return shouldInclude && (
      (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.pickupAddress || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Search Bar */}
      {showFloatingSearch && (
        <Animated.View style={styles.floatingSearchContainer}>
          <View style={styles.floatingSearchWrapper}>
            <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.floatingSearchInput}
              placeholder="Search by order ID, customer, or address..."
              placeholderTextColor={theme.colors.textSecondary}
              onChangeText={(text) => setSearchQuery(text)}
              value={searchQuery}
            />
          </View>
        </Animated.View>
      )}

      <Animated.FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkReady={handleMarkReady}
            onDispatchForDelivery={handleDispatchForDelivery}
            onMarkDelivered={handleMarkDelivered}
            onCallCustomer={handleCallCustomer}
          />
        )}
        ListHeaderComponent={
          <View>
            {/* Enhanced Header */}
            <View onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.welcomeSection}>
                    {/* <Text style={styles.welcomeText}>Welcome back! 👋</Text> */}
                    <Text style={styles.businessName}>{partnerName}</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <TrendingUp size={16} color={theme.colors.success} />
                        <Text style={styles.statText}>Active</Text>
                      </View>
                      <View style={styles.statDot} />
                      <View style={styles.statItem}>
                        <Star size={16} color={theme.colors.secondary} />
                        <Text style={styles.statText}>4.8 Rating</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.statusToggleButton,
                      { backgroundColor: isOpen ? theme.colors.success : theme.colors.error }
                    ]}
                    onPress={togglePartnerStatus}
                  >
                    <Power size={20} color={theme.colors.white} />
                    <Text style={styles.statusToggleText}>
                      {isOpen ? 'Online' : 'Offline'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Enhanced Search Bar */}
            <View onLayout={e => setSearchBarHeight(e.nativeEvent.layout.height)}>
              <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                  <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by order ID, customer, or address..."
                    placeholderTextColor={theme.colors.textSecondary}
                    onChangeText={(text) => setSearchQuery(text)}
                    value={searchQuery}
                  />
                </View>
              </View>
            </View>

            {/* Enhanced Tabs */}
            <View style={styles.tabContainer}>
              {renderTabButton('pending', 'Pending')}
              {renderTabButton('in_process', 'Processing')}
              {renderTabButton('ready_for_delivery', 'Delivery')}
            </View>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (event: any) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              // Show floating search only when header+search bar is fully out of view
              if (headerHeight + searchBarHeight > 0) {
                setShowFloatingSearch(offsetY >= headerHeight + searchBarHeight - 10);
              } else {
                setShowFloatingSearch(offsetY > 100);
              }
            },
          }
        )}
        scrollEventThrottle={16}
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
            <Text style={styles.emptyText}>
              {activeTab === 'pending' ? 'No orders to process' : 
               activeTab === 'in_process' ? 'No orders in process' :
               'No orders to deliver'}
            </Text>
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
    backgroundColor: theme.colors.white,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  businessName: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  statusToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  statusToggleText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  floatingSearchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    zIndex: 1000,
    ...theme.shadows.md,
  },
  floatingSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  floatingSearchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
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
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
});