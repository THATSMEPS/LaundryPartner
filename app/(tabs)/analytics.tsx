import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { CalendarDays, TrendingUp, DollarSign, Package, IndianRupee } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import { 
  getRevenueAnalytics, 
  getOrderAnalytics, 
  getServiceAnalytics, 
  getPerformanceMetrics,
  getPartnerOrders 
} from '@/utils/api';

// Define Order type (based on your codebase)
type Order = {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupAddress: string;
  deliveredDate?: string;
  deliveredAt?: string;
  placedAt?: string;
  totalAmount?: number;
  status: string;
  services?: string[];
  paymentStatus?: string;
  rating?: number;
  feedback?: string;
};

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: theme.colors.white,
  backgroundGradientFrom: theme.colors.white,
  backgroundGradientTo: theme.colors.white,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 121, 107, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(66, 66, 66, ${opacity})`,
  style: {
    borderRadius: theme.borderRadius.md,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: theme.colors.primary,
  },
};

const revenueData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [1200, 1800, 1500, 2200, 1900, 2800, 2100],
      color: (opacity = 1) => `rgba(0, 121, 107, ${opacity})`,
      strokeWidth: 3,
    },
  ],
};

const orderVolumeData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [
    {
      data: [45, 52, 48, 61],
      color: (opacity = 1) => `rgba(255, 205, 45, ${opacity})`,
    },
  ],
};

const serviceBreakdownData = [
  {
    name: 'Wash & Fold',
    population: 45,
    color: theme.colors.primary,
    legendFontColor: theme.colors.textPrimary,
    legendFontSize: 12,
  },
  {
    name: 'Dry Clean',
    population: 30,
    color: theme.colors.secondary,
    legendFontColor: theme.colors.textPrimary,
    legendFontSize: 12,
  },
  {
    name: 'Express',
    population: 15,
    color: theme.colors.success,
    legendFontColor: theme.colors.textPrimary,
    legendFontSize: 12,
  },
  {
    name: 'Premium',
    population: 10,
    color: theme.colors.warning,
    legendFontColor: theme.colors.textPrimary,
    legendFontSize: 12,
  },
];

const timeFilters = [
  { key: 'today', label: 'Today' },
  { key: '7days', label: '7 Days' },
  { key: '30days', label: 'This Month' },
  { key: 'custom', label: 'Custom Range' },
];

export default function AnalyticsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<string>('7days');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(), // today
  });
  const [metrics, setMetrics] = useState<{
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueData: any;
    orderVolumeData: any;
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    revenueData: revenueData,
    orderVolumeData: orderVolumeData,
  });

  useEffect(() => {
    fetchOrders();
  }, [selectedFilter, customDateRange]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getPartnerOrders();
      const allOrders = res.data?.orders || res.orders || [];
      // Only delivered orders
      const deliveredOrders = allOrders.filter((order: Order) => order.status === 'delivered');
      // Filter by selectedFilter (date range)
      const filteredOrders = filterOrdersByTime(deliveredOrders, selectedFilter);
      // Compute metrics
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalOrders = filteredOrders.length;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const revenueData = computeRevenueTrend(filteredOrders, selectedFilter);
      const orderVolumeData = computeOrderVolume(filteredOrders, selectedFilter);
      setMetrics({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        revenueData,
        orderVolumeData,
      });
      setOrders(filteredOrders);
    } catch (e) {
      setMetrics({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        revenueData: revenueData,
        orderVolumeData: orderVolumeData,
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: filter orders by selected time filter
  function filterOrdersByTime(orders: Order[], filterKey: string): Order[] {
    const now = new Date();
    return orders.filter((order: Order) => {
      const date = new Date(order.deliveredDate || order.deliveredAt || order.placedAt || '');
      if (isNaN(date.getTime())) return false;
      switch (filterKey) {
        case 'today':
          return date.toDateString() === now.toDateString();
        case '7days':
          return date >= addDays(now, -6);
        case '30days':
          return date >= addDays(now, -29);
        case 'custom':
          return date >= customDateRange.startDate && date <= customDateRange.endDate;
        default:
          return true;
      }
    });
  }

  // Helper: add days to a date
  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // Helper: compute revenue trend (by day for 7days/today, by week for 30days/month)
  function computeRevenueTrend(orders: Order[], filterKey: string) {
    let labels: string[] = [];
    let data: number[] = [];
    const now = new Date();
    if (filterKey === 'today') {
      labels = ['Today'];
      data = [orders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0)];
    } else if (filterKey === '7days') {
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(now, -(6 - i));
        return d.toLocaleDateString('en-IN', { weekday: 'short' });
      });
      data = labels.map((_, i) => {
        const d = addDays(now, -(6 - i));
        return orders.filter((o: Order) => {
          const od = new Date(o.deliveredDate || o.deliveredAt || o.placedAt || '');
          return od.toDateString() === d.toDateString();
        }).reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);
      });
    } else if (filterKey === '30days' || filterKey === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = [0, 0, 0, 0];
      orders.forEach((o: Order) => {
        const od = new Date(o.deliveredDate || o.deliveredAt || o.placedAt || '');
        const diff = Math.floor((now.getTime() - od.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0 || diff > 29) return;
        const week = Math.floor(diff / 7);
        data[3 - week] += o.totalAmount || 0;
      });
    }
    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(0, 121, 107, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  }

  // Helper: compute order volume (by week for 30days/month, by day for 7days/today)
  function computeOrderVolume(orders: Order[], filterKey: string) {
    let labels: string[] = [];
    let data: number[] = [];
    const now = new Date();
    if (filterKey === 'today') {
      labels = ['Today'];
      data = [orders.length];
    } else if (filterKey === '7days') {
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(now, -(6 - i));
        return d.toLocaleDateString('en-IN', { weekday: 'short' });
      });
      data = labels.map((_, i) => {
        const d = addDays(now, -(6 - i));
        return orders.filter((o: Order) => {
          const od = new Date(o.deliveredDate || o.deliveredAt || o.placedAt || '');
          return od.toDateString() === d.toDateString();
        }).length;
      });
    } else if (filterKey === '30days' || filterKey === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = [0, 0, 0, 0];
      orders.forEach((o: Order) => {
        const od = new Date(o.deliveredDate || o.deliveredAt || o.placedAt || '');
        const diff = Math.floor((now.getTime() - od.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0 || diff > 29) return;
        const week = Math.floor(diff / 7);
        data[3 - week] += 1;
      });
    }
    console.log('[OrderVolume] X Axis Labels:', labels);
    console.log('[OrderVolume] Raw Data:', data);
    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(255, 205, 45, ${opacity})`,
        },
      ],
    };
  }

  

  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string,
    change: string,
    isPositive: boolean
  ) => (
    <Card style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIcon}>{icon}</View>
        {change ? (
          <View style={[styles.changeIndicator, { backgroundColor: isPositive ? theme.colors.success : theme.colors.error }]}> 
            <Text style={styles.changeText}>{change}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </Card>
  );

  const renderFilterButton = (filter: typeof timeFilters[0]) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterButton,
        selectedFilter === filter.key && styles.activeFilterButton,
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter.key && styles.activeFilterButtonText,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  // Helper for order volume chart segments and Y labels
  function getOrderVolumeSegments(data: number[]): number {
    const max = Math.max(...data, 0);
    // Define minimum interval to avoid binary feeling when max is low
    const minInterval = 6;
    // Calculate top value for y-axis as max + interval
    const interval = Math.ceil(max / 6) || 1;
    const adjustedInterval = interval < minInterval ? minInterval : interval;
    const topValue = max + adjustedInterval;
    // Calculate step for y-axis labels (6 segments)
    const step = Math.ceil(topValue / 6) || 1;
    const yLabels = [];
    for (let i = 0; i <= topValue; i += step) {
      yLabels.push(i);
    }
    console.log('[OrderVolume] Y Axis Labels (ticks):', yLabels);
    return topValue;
  }
  function padOrderVolumeData(data: number[]): number[] {
    // Pad data to length 7 for 7days, or 4 for weeks, so chart is not squished
    if (data.length === 7) {
      while (data.length < 7) data.push(0);
    } else if (data.length === 4) {
      while (data.length < 4) data.push(0);
    }
    console.log('[OrderVolume] Padded Data:', data);
    return data;
  }

  const handleDatePickerOpen = () => {
    setSelectedFilter('custom');
    setDatePickerMode('start');
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setCustomDateRange(prev => ({ ...prev, startDate: selectedDate }));
        if (Platform.OS === 'ios') {
          setDatePickerMode('end');
        } else {
          // On Android, show end date picker after start date is selected
          setTimeout(() => {
            setDatePickerMode('end');
            setShowDatePicker(true);
          }, 100);
        }
      } else {
        setCustomDateRange(prev => ({ ...prev, endDate: selectedDate }));
        setShowDatePicker(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track your business performance</Text>
        </View>
        <TouchableOpacity style={styles.dateButton} onPress={handleDatePickerOpen}>
          <CalendarDays size={20} color={theme.colors.primary} />
          {selectedFilter === 'custom' && (
            <Text style={styles.dateRangeText}>
              {customDateRange.startDate.toLocaleDateString()} - {customDateRange.endDate.toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Filter */}
        <View style={styles.filterContainer}>
          {timeFilters.map(renderFilterButton)}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              {renderMetricCard(
                <IndianRupee size={24} color={theme.colors.primary} />, // Total Revenue
                'Total Revenue',
                `₹${metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                '',
                true
              )}
              {renderMetricCard(
                <Package size={24} color={theme.colors.secondary} />, // Total Orders
                'Total Orders',
                `${metrics.totalOrders}`,
                '',
                true
              )}
              {renderMetricCard(
                <TrendingUp size={24} color={theme.colors.success} />, // Avg Order Value
                'Avg Order Value',
                `₹${metrics.avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                '',
                true
              )}
            </View>

            {/* Revenue Trend */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Revenue Trend</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                {/* Rotated Y-axis label with even less space and higher zIndex */}
                <View style={{ width: 10, alignItems: 'center', justifyContent: 'center', height: 260, marginRight: -10, position: 'absolute', left: 0, top: 0, zIndex: 2 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, transform: [{ rotate: '-90deg' }], textAlign: 'center', width: 80, backgroundColor: 'transparent' }}>Revenue (₹)</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10, zIndex: 1 }}>
                  <LineChart
                    data={metrics.revenueData}
                    width={screenWidth - 100}
                    height={260}
                    chartConfig={{
                      ...chartConfig,
                      propsForBackgroundLines: {
                        strokeDasharray: '4',
                        stroke: theme.colors.textSecondary + '22',
                        strokeWidth: 1,
                      },
                    }}
                    bezier
                    style={{ ...styles.chart, marginRight: 0, marginLeft: 0 }}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    yAxisLabel=""
                    fromZero={true}
                  />
                </View>
              </View>
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>Day</Text>
            </Card>

            {/* Weekly Order Volume - updated to match Revenue Trend UI */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weekly Order Volume</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                {/* Rotated Y-axis label with even less space and higher zIndex */}
                <View style={{ width: 10, alignItems: 'center', justifyContent: 'center', height: 260, marginRight: -10, position: 'absolute', left: 0, top: 0, zIndex: 2 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, transform: [{ rotate: '-90deg' }], textAlign: 'center', width: 60, backgroundColor: 'transparent' }}>Orders</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10, zIndex: 1 }}>
                  <BarChart
                    data={{
                      ...metrics.orderVolumeData,
                      datasets: [
                        {
                          ...metrics.orderVolumeData.datasets[0],
                          data: padOrderVolumeData(metrics.orderVolumeData.datasets[0].data),
                        },
                      ],
                    }}
                    width={screenWidth - 100}
                    height={260}
                    chartConfig={{
                      ...chartConfig,
                      propsForBackgroundLines: {
                        strokeDasharray: '4',
                        stroke: theme.colors.textSecondary + '22',
                        strokeWidth: 1,
                      },
                    }}
                    style={{ ...styles.chart, marginRight: 0, marginLeft: 0 }}
                    withInnerLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero={true}
                    showValuesOnTopOfBars={true}
                    segments={getOrderVolumeSegments(metrics.orderVolumeData.datasets[0].data)}
                    yAxisInterval={Math.ceil((Math.max(...metrics.orderVolumeData.datasets[0].data) + 6) / 6) || 1}
                  />
                </View>
              </View>
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>{selectedFilter === '7days' || selectedFilter === 'today' ? 'Day' : 'Week'}</Text>
            </Card>

            {/* Service Breakdown (static for now) */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Revenue by Service</Text>
              <PieChart
                data={serviceBreakdownData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </Card>
          </>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerTitle}>
                Select {datePickerMode === 'start' ? 'Start' : 'End'} Date
              </Text>
              <DateTimePicker
                value={datePickerMode === 'start' ? customDateRange.startDate : customDateRange.endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)} // 1 year ago
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerButtons}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, styles.cancelButton]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.datePickerButton, styles.confirmButton]}
                    onPress={() => {
                      if (datePickerMode === 'start') {
                        setDatePickerMode('end');
                      } else {
                        setShowDatePicker(false);
                      }
                    }}
                  >
                    <Text style={styles.confirmButtonText}>
                      {datePickerMode === 'start' ? 'Next' : 'Done'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    backgroundColor: theme.colors.white,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  headerContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  dateButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateRangeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: theme.colors.white,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  changeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  metricValue: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  metricTitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  chartCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  chartTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    minWidth: screenWidth * 0.8,
  },
  datePickerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  confirmButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.white,
    fontWeight: '600',
  },
});