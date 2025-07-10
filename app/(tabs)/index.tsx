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
  Dimensions,
  Animated,
} from 'react-native';
import { RefreshCw, Search, Star, TrendingUp, Power } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import OrderCard, { Order } from '@/components/OrderCard';
import { getPartnerOrders, updateOrderStatus, updatePartnerStatus } from '@/utils/api';
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
  const [partnerName, setPartnerName] = useState('Partner');
  const [isOnline, setIsOnline] = useState(true);
  const scrollY = new Animated.Value(0);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  
  // Get screen width for responsive design
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    checkAuth();
  }, []);

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

  const togglePartnerStatus = async () => {
    try {
      const newStatus = !isOnline;
      await updatePartnerStatus({ isOnline: newStatus });
      setIsOnline(newStatus);
      Alert.alert(
        'Status Updated',
        `You are now ${newStatus ? 'online' : 'offline'}`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update status');
    }
  };

  const getTabCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  const renderTabButton = (
    tab: 'pending' | 'in_process' | 'out_for_delivery',
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
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back! 👋</Text>
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
              { backgroundColor: isOnline ? theme.colors.success : theme.colors.error }
            ]}
            onPress={togglePartnerStatus}
          >
            <Power size={20} color={theme.colors.white} />
            <Text style={styles.statusToggleText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={theme.colors.textSecondary}
            onChangeText={(text) => setSearchQuery(text)}
            value={searchQuery}
          />
        </View>
      </View>

      {/* Floating Search Bar */}
      {showFloatingSearch && (
        <Animated.View 
          style={[
            styles.floatingSearchContainer,
            {
              transform: [{ translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [-100, 0],
                extrapolate: 'clamp',
              })}],
            }
          ]}
        >
          <View style={styles.floatingSearchWrapper}>
            <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.floatingSearchInput}
              placeholder="Search orders..."
              placeholderTextColor={theme.colors.textSecondary}
              onChangeText={(text) => setSearchQuery(text)}
              value={searchQuery}
            />
          </View>
        </Animated.View>
      )}

      {/* Enhanced Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('pending', 'Pending')}
        {renderTabButton('in_process', 'Processing')}
        {renderTabButton('out_for_delivery', 'Delivery')}
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: true,
            listener: (event: any) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              setShowFloatingSearch(offsetY > 100);
            }
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