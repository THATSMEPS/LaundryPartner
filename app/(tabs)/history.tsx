import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Filter, Download, Eye, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { getPartnerOrders, getPartnerProfile } from '@/utils/api';
import { usePartnerProfile } from '@/hooks/usePartnerProfile';

interface HistoryOrder {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupAddress: string;
  deliveredDate: string;
  totalAmount: number;
  status: 'delivered' | 'rejected' | 'failed';
  services: string[];
  paymentStatus: 'paid' | 'unpaid';
  rating?: number;
  feedback?: string;
}

// 1. Update statusFilters to have first letter capitalized in label
const statusFilters = [
  { key: 'all', label: 'All Orders' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'failed', label: 'Failed' },
];

export default function HistoryScreen() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // 2. Set default selectedStatus to 'all' so All Orders is selected by default
  const [selectedStatus, setSelectedStatus] = useState('all'); // Default to All Orders
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<HistoryOrder | null>(null);
  const { profile: partnerProfile, saveProfile } = usePartnerProfile();

  // Fetch and update partner profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await getPartnerProfile();
        if (res && res.data) {
          // Map backend fields to PartnerProfile shape if needed
          const apiData = res.data;
          const mappedProfile = {
            businessName: apiData.name || '',
            // name: apiData.name || '',
            email: apiData.email || '',
            phone: apiData.mobile || '',
            address: apiData.address || '',
            serviceArea: apiData.areaId || '',
            ...apiData,
          };
          await saveProfile(mappedProfile);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const fetchOrders = async (status: string) => {
    try {
      let params = '';
      if (status && status !== 'all') params = `status=${status}`;
      const res = await getPartnerOrders(params);
      // Map backend order data to HistoryOrder interface
      const backendOrders = (res.data?.orders || res.orders || []);
      const mappedOrders: HistoryOrder[] = backendOrders.map((order: any) => ({
        id: order.id,
        customerName: order.customer?.name || 'N/A',
        phoneNumber: order.customer?.phone || '',
        pickupAddress: order.pickupAddress || '',
        deliveredDate: order.deliveredAt || order.placedAt || '',
        totalAmount: order.totalAmount || 0,
        status: order.status === 'delivered' || order.status === 'failed' || order.status === 'rejected' ? order.status : 'delivered',
        services: order.items?.map((item: any) => item.laundryItem?.name || item.name) || [],
        paymentStatus: order.paymentStatus || 'paid',
        rating: order.rating,
        feedback: order.feedback,
      }));
      setOrders(mappedOrders);
    } catch (e) {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders(selectedStatus);
  }, [selectedStatus]);

  // Only show delivered, failed, or rejected orders
  const filteredOrders = orders.filter(order => {
    // Only delivered, failed, or rejected
    const isRelevantStatus = order.status === 'delivered' || order.status === 'rejected' || order.status === 'failed';
    if (selectedStatus === 'all') {
      if (
      order.status !== 'delivered' &&
      order.status !== 'rejected' &&
      order.status !== 'failed'
    ) return false;
    } else {
      if (order.status !== selectedStatus) return false;
    }
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      case 'failed':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  // 3. Update getStatusText to always return first letter capitalized
  const getStatusText = (status: string) => {
    if (!status) return status;
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleOrderDetail = (order: HistoryOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleInvoice = (order: HistoryOrder) => {
    setInvoiceOrder(order);
    setInvoiceModalVisible(true);
  };

  const renderOrderCard = ({ item }: { item: HistoryOrder }) => {
    // Truncate order id after first hyphen
    const truncatedOrderId = item.id.includes('-') ? item.id.split('-')[0] : item.id;
    // Format date/time nicely (e.g. 07 Jul 2025, 10:30 AM)
    let formattedDate = '';
    if (item.deliveredDate) {
      const dateObj = new Date(item.deliveredDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        });
      } else {
        formattedDate = item.deliveredDate;
      }
    }
    return (
      <Card style={styles.orderCard}>
        {/* Name and status badge on same row */}
        <View style={styles.nameStatusRow}>
          <Text style={[styles.orderCustomerName, { textTransform: 'capitalize' }]}>{item.customerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.orderIdSmall}>#{truncatedOrderId}</Text>
        <Text style={styles.deliveredDate}>{formattedDate}</Text>
        <View style={styles.orderDetails}>
          <Text style={styles.servicesText}>{item.services.join(', ')}</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountSmall}>₹{item.totalAmount}</Text>
            {/* Removed payment status badge */}
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
          <TouchableOpacity style={styles.invoiceButton} onPress={() => handleInvoice(item)}>
            <Download size={16} color={theme.colors.primary} />
            <Text style={styles.detailButtonText}>Invoice</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

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

  // Helper function to convert number to words (Indian system, with paise)
  function numberToWordsWithPaise(amount: number): string {
    if (isNaN(amount)) return '';
    const num = Math.floor(amount);
    const paise = Math.round((amount * 100) % 100);
    const a = [ '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen' ];
    const b = [ '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety' ];
    let str = '';
    let n = num;
    if (n > 99999999) return amount.toString(); // too big
    let crore = Math.floor(n / 10000000);
    n = n % 10000000;
    let lakh = Math.floor(n / 100000);
    n = n % 100000;
    let thousand = Math.floor(n / 1000);
    n = n % 1000;
    let hundred = Math.floor(n / 100);
    n = n % 100;
    if (crore) str += a[crore] + ' crore ';
    if (lakh) str += a[lakh] + ' lakh ';
    if (thousand) str += a[thousand] + ' thousand ';
    if (hundred) str += a[hundred] + ' hundred ';
    if (num > 0 && (num % 100) > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n];
      else str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    }
    str = str.trim();
    let rupeesPart = str ? str + ' rupees' : '';
    let paisePart = '';
    if (paise > 0) {
      if (paise < 20) paisePart = a[paise] + ' paise';
      else paisePart = b[Math.floor(paise / 10)] + (paise % 10 ? ' ' + a[paise % 10] : '') + ' paise';
    }
    if (rupeesPart && paisePart) return rupeesPart + ' and ' + paisePart;
    if (rupeesPart) return rupeesPart;
    if (paisePart) return paisePart;
    return 'zero rupees';
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header and search/filter on same line, less padding */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Order History</Text>
        <View style={styles.searchFilterRow}>
          <View style={styles.searchBarInline}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Order ID, Customer, or Service"
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={theme.colors.primary} />
          </TouchableOpacity>
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
            <View style={{ flex: 1 }}>
              <Card style={styles.detailCard}>
                <ScrollView contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
                  {/* Customer Information first */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitleSmall}>Customer Information</Text>
                    <Text style={styles.detailTextSmall}>Name: {selectedOrder.customerName}</Text>
                    <Text style={styles.detailTextSmall}>Phone: {selectedOrder.phoneNumber}</Text>
                    <Text style={styles.detailTextSmall}>Address: {selectedOrder.pickupAddress}</Text>
                  </View>
                  {/* Order Information */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitleSmall}>Order Information</Text>
                    {/* Truncate order id after first hyphen */}
                    <Text style={styles.detailTextSmall}>Order ID: {selectedOrder.id.includes('-') ? selectedOrder.id.split('-')[0] : selectedOrder.id}</Text>
                    <Text style={styles.detailTextSmall}>Services:</Text>
                    {selectedOrder.services.map((service, index) => (
                      <Text key={index} style={styles.serviceItemSmall}>• {service}</Text>
                    ))}
                    {/* Format date/time nicely */}
                    <Text style={styles.detailTextSmall}>Date: {(() => {
                      const dateObj = new Date(selectedOrder.deliveredDate);
                      if (!isNaN(dateObj.getTime())) {
                        return dateObj.toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        });
                      } else {
                        return selectedOrder.deliveredDate;
                      }
                    })()}</Text>
                  </View>
                  {/* Payment Information */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitleSmall}>Payment Information</Text>
                    <Text style={styles.detailTextSmall}>Total Amount: ₹{selectedOrder.totalAmount}</Text>
                    <Text style={styles.detailTextSmall}>
                      Payment Status: {selectedOrder.paymentStatus.toUpperCase()}
                    </Text>
                  </View>
                  {/* Feedback */}
                  {selectedOrder.rating && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitleSmall}>Customer Feedback</Text>
                      <Text style={styles.detailTextSmall}>Rating: ★ {selectedOrder.rating}/5</Text>
                      {selectedOrder.feedback && (
                        <Text style={styles.detailTextSmall}>Feedback: "{selectedOrder.feedback}"</Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              </Card>
            </View>
          )}

          <View style={styles.modalFooter}>
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.invoiceButton}
                onPress={() => console.log('Download invoice')}
              >
                <Download size={16} color={theme.colors.primary} />
                <Text style={styles.detailButtonText}>Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.invoiceButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.detailButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        visible={invoiceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInvoiceModalVisible(false)}
      >
        <View style={styles.invoiceModalOverlay}>
          <View style={styles.invoiceModalContent}>
            <ScrollView contentContainerStyle={styles.invoiceScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.invoiceCompanyName}>{partnerProfile?.name || partnerProfile?.businessName || 'Laundry Partner'}</Text>
              <View style={styles.invoiceHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invoiceLabel}>Name:</Text>
                  <Text style={styles.invoiceValue}>{invoiceOrder?.customerName || ''}</Text>
                  <Text style={styles.invoiceLabel}>Address:</Text>
                  <Text style={styles.invoiceValue}>{invoiceOrder?.pickupAddress || ''}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invoiceLabel}>Invoice No:</Text>
                  <Text style={styles.invoiceValue}>{invoiceOrder ? (invoiceOrder.id.includes('-') ? invoiceOrder.id.split('-')[0] : invoiceOrder.id) : ''}</Text>
                  <Text style={styles.invoiceLabel}>Invoice Date:</Text>
                  <Text style={styles.invoiceValue}>{invoiceOrder ? (() => {
                    const dateObj = new Date(invoiceOrder.deliveredDate);
                    if (!isNaN(dateObj.getTime())) {
                      return dateObj.toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                      });
                    } else {
                      return invoiceOrder.deliveredDate;
                    }
                  })() : ''}</Text>
                </View>
              </View>
              <View style={styles.invoiceTableHeader}>
                <Text style={styles.invoiceTableCellSN}>S.No:</Text>
                <Text style={styles.invoiceTableCellDesc}>Description</Text>
                <Text style={styles.invoiceTableCellQty}>Qty</Text>
                <Text style={styles.invoiceTableCellRate}>Rate</Text>
                <Text style={styles.invoiceTableCellAmt}>Amount</Text>
              </View>
              {/* Only one row for all services, as per available data */}
              {invoiceOrder && invoiceOrder.services.map((service, idx) => (
                <View style={styles.invoiceTableRow} key={idx}>
                  <Text style={styles.invoiceTableCellSN}>{idx + 1}</Text>
                  <Text style={styles.invoiceTableCellDesc}>{service}</Text>
                  <Text style={styles.invoiceTableCellQty}>1</Text>
                  <Text style={styles.invoiceTableCellRate}>{invoiceOrder.totalAmount}</Text>
                  <Text style={styles.invoiceTableCellAmt}>{invoiceOrder.totalAmount}</Text>
                </View>
              ))}
              <View style={styles.invoiceTableFooter}>
                <Text style={styles.invoiceTableCellSN}></Text>
                <Text style={styles.invoiceTableCellDesc}></Text>
                <Text style={styles.invoiceTableCellQty}></Text>
                <Text style={styles.invoiceTableCellRate}>Total</Text>
                <Text style={styles.invoiceTableCellAmt}>{invoiceOrder?.totalAmount || ''}</Text>
              </View>
              <Text style={styles.invoiceRupees}>
                Rupees in Word: {invoiceOrder && invoiceOrder.totalAmount !== undefined ? numberToWordsWithPaise(invoiceOrder.totalAmount) + ' only' : ''}
              </Text>
              <Text style={styles.invoiceTerms}>Terms and Conditions</Text>
            </ScrollView>
            <TouchableOpacity style={styles.invoiceCloseButton} onPress={() => setInvoiceModalVisible(false)}>
              <Text style={styles.invoiceCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm, // less padding below heading
    backgroundColor: theme.colors.white,
    flexDirection: 'column',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  searchBarInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing.md,
    height: 48, // match filterButton height
    minWidth: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    marginLeft: theme.spacing.sm,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  nameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  orderCustomerName: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 0,
    marginTop: 0,
  },
  orderIdSmall: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 0,
    marginTop: 2,
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
  deliveredDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    marginTop: 2,
  },
  orderDetails: {
    marginBottom: 2,
    marginTop: 2,
  },
  servicesText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    marginTop: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  amountSmall: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 0,
    marginTop: 0,
  },
  paymentBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
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
    marginBottom: 2,
    marginTop: 2,
  },
  ratingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.secondary,
    fontWeight: '600',
    marginBottom: 2,
    marginTop: 2,
  },
  feedbackText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 0,
    marginTop: 0,
  },
  orderFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
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
  invoiceButton: {
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
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  detailCard: {
    padding: theme.spacing.md,
  },
  detailScrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  detailSection: {
    marginBottom: theme.spacing.md,
  },
  detailSectionTitleSmall: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  detailTextSmall: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  serviceItemSmall: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    marginBottom: 2,
  },
  invoiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceModalContent: {
    width: '92%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.lg,
    maxHeight: '90%',
  },
  invoiceScrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  invoiceCompanyName: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'left',
    marginBottom: 8,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
  },
  invoiceValue: {
    fontSize: 13,
    marginBottom: 2,
  },
  invoiceTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: theme.colors.textSecondary,
    paddingVertical: 4,
    marginTop: 8,
  },
  invoiceTableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  invoiceTableFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: theme.colors.textSecondary,
    paddingVertical: 4,
  },
  invoiceTableCellSN: {
    width: 40, // increased from 32
    fontSize: 12,
    textAlign: 'left',
    paddingRight: 4, // add a little space to the right
  },
  invoiceTableCellDesc: {
    flex: 2,
    fontSize: 12,
    textAlign: 'left',
    paddingLeft: 2, // add a little space to the left
  },
  invoiceTableCellQty: {
    width: 32,
    fontSize: 12,
    textAlign: 'center',
  },
  invoiceTableCellRate: {
    width: 48,
    fontSize: 12,
    textAlign: 'center',
  },
  invoiceTableCellAmt: {
    width: 56,
    fontSize: 12,
    textAlign: 'right',
  },
  invoiceRupees: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 2,
  },
  invoiceTerms: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  invoiceCloseButton: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  invoiceCloseButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});