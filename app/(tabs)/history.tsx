import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Search, Filter, Download, Eye, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface HistoryOrder {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupAddress: string;
  completedDate: string;
  totalAmount: number;
  status: 'completed' | 'rejected' | 'cancelled';
  services: string[];
  paymentStatus: 'paid' | 'unpaid';
  rating?: number;
  feedback?: string;
}

const mockHistoryOrders: HistoryOrder[] = [
  {
    id: 'ORD001',
    customerName: 'Rajesh Kumar',
    phoneNumber: '+91 98765 43210',
    pickupAddress: 'A/203, Shela Garden, Ahmedabad',
    completedDate: '2025-01-08',
    totalAmount: 250,
    status: 'completed',
    services: ['Wash & Fold (5kg)', 'Starch'],
    paymentStatus: 'paid',
    rating: 4.5,
    feedback: 'Great service, very satisfied!',
  },
  {
    id: 'ORD002',
    customerName: 'Priya Sharma',
    phoneNumber: '+91 87654 32109',
    pickupAddress: 'B/105, Maple Heights, Shela',
    completedDate: '2025-01-07',
    totalAmount: 480,
    status: 'completed',
    services: ['Dry Clean (8 pieces)', 'Premium Packaging'],
    paymentStatus: 'paid',
    rating: 5.0,
    feedback: 'Excellent quality and quick delivery!',
  },
  {
    id: 'ORD003',
    customerName: 'Amit Patel',
    phoneNumber: '+91 76543 21098',
    pickupAddress: 'C/401, Green Valley, Near Shela',
    completedDate: '2025-01-06',
    totalAmount: 120,
    status: 'rejected',
    services: ['Express Wash'],
    paymentStatus: 'unpaid',
  },
  {
    id: 'ORD004',
    customerName: 'Neha Gupta',
    phoneNumber: '+91 65432 10987',
    pickupAddress: 'D/102, Sunrise Apartments, Shela',
    completedDate: '2025-01-05',
    totalAmount: 350,
    status: 'completed',
    services: ['Ethnic Wear Cleaning (6 pieces)', 'Special Care'],
    paymentStatus: 'paid',
    rating: 4.8,
  },
];

const statusFilters = [
  { key: 'all', label: 'All Orders' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function HistoryScreen() {
  const [orders, setOrders] = useState<HistoryOrder[]>(mockHistoryOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleOrderDetail = (order: HistoryOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const renderOrderCard = ({ item }: { item: HistoryOrder }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.completedDate}>Completed: {item.completedDate}</Text>

      <View style={styles.orderDetails}>
        <Text style={styles.servicesText}>
          {item.services.join(', ')}
        </Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>₹{item.totalAmount}</Text>
          <View style={[
            styles.paymentBadge,
            { backgroundColor: item.paymentStatus === 'paid' ? theme.colors.success : theme.colors.warning }
          ]}>
            <Text style={styles.paymentText}>{item.paymentStatus.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {item.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>★ {item.rating}</Text>
          {item.feedback && (
            <Text style={styles.feedbackText} numberOfLines={2}>
              "{item.feedback}"
            </Text>
          )}
        </View>
      )}

      <View style={styles.orderFooter}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => handleOrderDetail(item)}
        >
          <Eye size={16} color={theme.colors.primary} />
          <Text style={styles.detailButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadButton}>
          <Download size={16} color={theme.colors.secondary} />
          <Text style={styles.downloadButtonText}>Invoice</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderFilterButton = (filter: typeof statusFilters[0]) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedStatus === filter.key && styles.activeFilterChip,
      ]}
      onPress={() => setSelectedStatus(filter.key)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedStatus === filter.key && styles.activeFilterChipText,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID, Customer, or Service"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Orders</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <X size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Order Status</Text>
            <View style={styles.filterChipsContainer}>
              {statusFilters.map(renderFilterButton)}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <Button
              title="Apply Filters"
              onPress={() => setFilterModalVisible(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <X size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <View style={styles.modalContent}>
              <Card style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailOrderId}>#{selectedOrder.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(selectedOrder.status)}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Customer Information</Text>
                  <Text style={styles.detailText}>Name: {selectedOrder.customerName}</Text>
                  <Text style={styles.detailText}>Phone: {selectedOrder.phoneNumber}</Text>
                  <Text style={styles.detailText}>Address: {selectedOrder.pickupAddress}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Order Information</Text>
                  <Text style={styles.detailText}>Services:</Text>
                  {selectedOrder.services.map((service, index) => (
                    <Text key={index} style={styles.serviceItem}>• {service}</Text>
                  ))}
                  <Text style={styles.detailText}>Completed: {selectedOrder.completedDate}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Payment Information</Text>
                  <Text style={styles.detailText}>Total Amount: ₹{selectedOrder.totalAmount}</Text>
                  <Text style={styles.detailText}>
                    Payment Status: {selectedOrder.paymentStatus.toUpperCase()}
                  </Text>
                </View>

                {selectedOrder.rating && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Customer Feedback</Text>
                    <Text style={styles.detailText}>Rating: ★ {selectedOrder.rating}/5</Text>
                    {selectedOrder.feedback && (
                      <Text style={styles.detailText}>Feedback: "{selectedOrder.feedback}"</Text>
                    )}
                  </View>
                )}
              </Card>
            </View>
          )}

          <View style={styles.modalFooter}>
            <Button
              title="Download Invoice"
              onPress={() => console.log('Download invoice')}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Close"
              onPress={() => setDetailModalVisible(false)}
              style={styles.modalButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  filterButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  searchContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
  },
  orderCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderId: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  customerName: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  completedDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  orderDetails: {
    marginBottom: theme.spacing.md,
  },
  servicesText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  paymentBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  paymentText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  ratingContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  ratingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  feedbackText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.xs,
  },
  detailButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    gap: theme.spacing.xs,
  },
  downloadButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.secondary,
    fontWeight: '600',
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
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  filterSectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: theme.colors.white,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  detailCard: {
    padding: theme.spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  detailOrderId: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  detailSectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  serviceItem: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
});