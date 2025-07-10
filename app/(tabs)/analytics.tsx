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
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp, DollarSign, Package, IndianRupee } from 'lucide-react-native';
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

export default function AnalyticsScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
  const [selectedFilter, setSelectedFilter] = useState<'7days' | 'today' | 'month'>('7days');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!loading) {
      updateMetricsWithFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, selectedFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getPartnerOrders();
      const allOrders = res.data?.orders || res.orders || [];
      const deliveredOrders: Order[] = allOrders.filter((order: Order) => order.status === 'delivered');
      setOrders(deliveredOrders);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to filter orders by selectedFilter
  function filterOrdersByDate(orders: Order[], filter: '7days' | 'today' | 'month') {
    const now = new Date();
    if (filter === 'today') {
      return orders.filter(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        return date.toDateString() === now.toDateString();
      });
    } else if (filter === '7days') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      return orders.filter(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        return date >= weekAgo && date <= now;
      });
    } else if (filter === 'month') {
      return orders.filter(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
    }
    return orders;
  }

  // Generate chart data from filtered orders
  function updateMetricsWithFilter() {
    const filtered = filterOrdersByDate(orders, selectedFilter);
    // Revenue Trend (LineChart)
    let revenueLabels: string[] = [];
    let revenueDataArr: number[] = [];
    if (selectedFilter === 'today') {
      // 24 hours
      revenueLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      revenueDataArr = Array(24).fill(0);
      filtered.forEach(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        const hour = date.getHours();
        revenueDataArr[hour] += order.totalAmount || 0;
      });
    } else if (selectedFilter === '7days') {
      // Last 7 days
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      revenueLabels = days.map(d => d.toLocaleDateString('en-IN', { weekday: 'short' }));
      revenueDataArr = Array(7).fill(0);
      filtered.forEach(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        for (let i = 0; i < days.length; i++) {
          if (date.toDateString() === days[i].toDateString()) {
            revenueDataArr[i] += order.totalAmount || 0;
            break;
          }
        }
      });
    } else if (selectedFilter === 'month') {
      // Weeks in month (up to 5)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const weeks = [0, 1, 2, 3, 4];
      revenueLabels = weeks.map(w => `Week ${w + 1}`);
      revenueDataArr = Array(5).fill(0);
      filtered.forEach(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        if (date.getMonth() === month && date.getFullYear() === year) {
          const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
          revenueDataArr[weekOfMonth] += order.totalAmount || 0;
        }
      });
    }
    // Order Volume (BarChart)
    let orderVolumeLabels: string[] = [];
    let orderVolumeArr: number[] = [];
    if (selectedFilter === 'today') {
      orderVolumeLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      orderVolumeArr = Array(24).fill(0);
      filtered.forEach(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        const hour = date.getHours();
        orderVolumeArr[hour] += 1;
      });
    } else if (selectedFilter === '7days') {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      orderVolumeLabels = days.map(d => d.toLocaleDateString('en-IN', { weekday: 'short' }));
      orderVolumeArr = Array(7).fill(0);
      filtered.forEach(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        for (let i = 0; i < days.length; i++) {
          if (date.toDateString() === days[i].toDateString()) {
            orderVolumeArr[i] += 1;
            break;
          }
        }
      });
    } else if (selectedFilter === 'month') {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const weeks = [0, 1, 2, 3, 4];
      orderVolumeLabels = weeks.map(w => `Week ${w + 1}`);
      orderVolumeArr = Array(5).fill(0);
      filtered.forEach(order => {
        const date = new Date(order.deliveredAt || order.deliveredDate || order.placedAt || '');
        if (date.getMonth() === month && date.getFullYear() === year) {
          const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
          orderVolumeArr[weekOfMonth] += 1;
        }
      });
    }
    // Key metrics
    const totalRevenue = filtered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = filtered.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    setMetrics({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueData: {
        labels: revenueLabels,
        datasets: [
          {
            data: revenueDataArr,
            color: (opacity = 1) => `rgba(0, 121, 107, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      orderVolumeData: {
        labels: orderVolumeLabels,
        datasets: [
          {
            data: orderVolumeArr,
            color: (opacity = 1) => `rgba(255, 205, 45, ${opacity})`,
          },
        ],
      },
    });
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
    // console.log('[OrderVolume] Y Axis Labels (ticks):', yLabels);
    return topValue;
  }
  function padOrderVolumeData(data: number[]): number[] {
    // Pad data to length 7 for 7days, or 4 for weeks, so chart is not squished
    if (data.length === 7) {
      while (data.length < 7) data.push(0);
    } else if (data.length === 4) {
      while (data.length < 4) data.push(0);
    }
    // console.log('[OrderVolume] Padded Data:', data);
    return data;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header now scrolls with content */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Track your business performance</Text>
          </View>
        </View>
        {/* Filter Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12 }}>
          {['7days', 'today', 'month'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={{
                backgroundColor: selectedFilter === filter ? theme.colors.primary : theme.colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginHorizontal: 6,
              }}
              onPress={() => setSelectedFilter(filter as '7days' | 'today' | 'month')}
            >
              <Text style={{ color: selectedFilter === filter ? theme.colors.white : theme.colors.textPrimary }}>
                {filter === '7days' ? 'Last 7 Days' : filter === 'today' ? 'Today' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
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

            {/* Weekly Order Volume - now using LineChart like Revenue Trend */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weekly Order Volume</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                {/* Rotated Y-axis label with even less space and higher zIndex */}
                <View style={{ width: 10, alignItems: 'center', justifyContent: 'center', height: 260, marginRight: -10, position: 'absolute', left: 0, top: 0, zIndex: 2 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, transform: [{ rotate: '-90deg' }], textAlign: 'center', width: 60, backgroundColor: 'transparent' }}>Orders</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10, zIndex: 1 }}>
                  <LineChart
                    data={metrics.orderVolumeData}
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
  content: {
    flex: 1,
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
});