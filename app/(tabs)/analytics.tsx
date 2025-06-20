import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { CalendarDays, TrendingUp, DollarSign, Package, Clock } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';

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
  { key: '30days', label: '30 Days' },
  { key: 'month', label: 'This Month' },
];

export default function AnalyticsScreen() {
  const [selectedFilter, setSelectedFilter] = useState('7days');

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
        <View style={[styles.changeIndicator, { backgroundColor: isPositive ? theme.colors.success : theme.colors.error }]}>
          <Text style={styles.changeText}>{change}</Text>
        </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Business Analytics</Text>
        <TouchableOpacity style={styles.dateButton}>
          <CalendarDays size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Filter */}
        <View style={styles.filterContainer}>
          {timeFilters.map(renderFilterButton)}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          {renderMetricCard(
            <DollarSign size={24} color={theme.colors.primary} />,
            'Total Revenue',
            '₹12,450',
            '+12%',
            true
          )}
          {renderMetricCard(
            <Package size={24} color={theme.colors.secondary} />,
            'Total Orders',
            '147',
            '+8%',
            true
          )}
          {renderMetricCard(
            <TrendingUp size={24} color={theme.colors.success} />,
            'Avg Order Value',
            '₹285',
            '+15%',
            true
          )}
          {renderMetricCard(
            <Clock size={24} color={theme.colors.warning} />,
            'Avg Processing Time',
            '18 hrs',
            '-5%',
            false
          )}
        </View>

        {/* Revenue Trend */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <LineChart
            data={revenueData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </Card>

        {/* Order Volume */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Order Volume</Text>
          <BarChart
            data={orderVolumeData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={false}
            showValuesOnTopOfBars={true}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </Card>

        {/* Service Breakdown */}
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

        {/* Performance Metrics */}
        <Card style={styles.performanceCard}>
          <Text style={styles.chartTitle}>Performance Metrics</Text>
          <View style={styles.performanceMetrics}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Order Approval Rate</Text>
              <View style={styles.performanceBar}>
                <View style={[styles.performanceProgress, { width: '95%', backgroundColor: theme.colors.success }]} />
              </View>
              <Text style={styles.performanceValue}>95%</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>On-Time Delivery</Text>
              <View style={styles.performanceBar}>
                <View style={[styles.performanceProgress, { width: '88%', backgroundColor: theme.colors.secondary }]} />
              </View>
              <Text style={styles.performanceValue}>88%</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Customer Satisfaction</Text>
              <View style={styles.performanceBar}>
                <View style={[styles.performanceProgress, { width: '92%', backgroundColor: theme.colors.primary }]} />
              </View>
              <Text style={styles.performanceValue}>4.6/5</Text>
            </View>
          </View>
        </Card>
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
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  dateButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
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
  performanceCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  performanceMetrics: {
    gap: theme.spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  performanceLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  performanceBar: {
    flex: 2,
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  performanceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});