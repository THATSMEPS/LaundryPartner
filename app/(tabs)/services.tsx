import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { Plus, Search, Filter } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import ServiceCard from '@/components/ServiceCard';
import ServiceFormModal from '@/components/ServiceFormModal';
import { Service } from '@/types/service';
import { 
  getAllLaundryItems, 
  createLaundryItem, 
  updateLaundryItem, 
  deleteLaundryItem, 
  toggleLaundryItemAvailability 
} from '@/utils/api';
import Toast from 'react-native-toast-message';

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Wash & Fold',
    description: 'Basic washing and folding service',
    price: 50,
    apparelTypes: 'Cotton,Polyester',
    isAvailable: true,
    partnerId: 'lp001',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Dry Cleaning',
    description: 'Professional dry cleaning for delicate items',
    price: 80,
    apparelTypes: 'Silk,Wool,Cashmere',
    isAvailable: true,
    partnerId: 'lp001',
    createdAt: '2025-01-16T11:15:00Z',
    updatedAt: '2025-01-16T11:15:00Z',
  },
  {
    id: '3',
    name: 'Express Wash',
    description: 'Quick wash service for urgent needs',
    price: 150,
    apparelTypes: 'Cotton,Denim',
    isAvailable: false,
    partnerId: 'lp001',
    createdAt: '2025-01-17T09:45:00Z',
    updatedAt: '2025-01-17T09:45:00Z',
  },
];

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const screenWidth = Dimensions.get('window').width;
  const scrollY = new Animated.Value(0);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    apparelTypes: string;
    isAvailable: boolean;
    state: string;
    area: string;
  }>({
    name: '',
    description: '',
    price: '',
    apparelTypes: '',
    isAvailable: true,
    state: '',
    area: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      apparelTypes: '',
      isAvailable: true,
      state: '',
      area: '',
    });
    setEditingService(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      apparelTypes: service.apparelTypes || '',
      isAvailable: service.isAvailable,
      state: '',
      area: '',
    });
    setEditingService(service);
    setModalVisible(true);
  };

  // Load services from API
  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await getAllLaundryItems();
      setServices(response.data || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: formData.price, // keep as string
        apparelTypes: formData.apparelTypes, // keep as string
        isAvailable: formData.isAvailable,
      };

      if (editingService) {
        await updateLaundryItem(editingService.id, serviceData);
        Alert.alert('Success', 'Service updated successfully');
      } else {
        await createLaundryItem(serviceData);
        Alert.alert('Success', 'Service created successfully');
      }

      await loadServices();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save service');
    }
  };

  const handleDelete = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteLaundryItem(serviceId);
              await loadServices();
              if (
                response &&
                response.message &&
                response.message.includes('cannot be deleted')
              ) {
                Toast.show({
                  type: 'info',
                  text1: 'Service Disabled',
                  text2:
                    'Pending Orders are there for this service, cannot be deleted.',
                });
              } else {
                Alert.alert('Success', 'Service deleted successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    try {
      await toggleLaundryItemAvailability(serviceId, { isAvailable: !service.isAvailable });
      await loadServices();
      Alert.alert('Success', `Service ${!service.isAvailable ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update service availability');
    }
  };

  const getPriceDisplay = (service: Service) => {
    return `₹${service.price}`;
  };

  // Filter and search services
  const getFilteredServices = () => {
    let filtered = services;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.apparelTypes && service.apparelTypes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply availability filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(service =>
        selectedFilter === 'available' ? service.isAvailable : !service.isAvailable
      );
    }

    return filtered;
  };

  const renderFilterButton = (filter: 'all' | 'available' | 'unavailable', title: string) => {
    const isActive = selectedFilter === filter;
    let count = 0;
    
    if (filter === 'all') count = services.length;
    else if (filter === 'available') count = services.filter(s => s.isAvailable).length;
    else count = services.filter(s => !s.isAvailable).length;

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && styles.activeFilterButton,
          { minWidth: screenWidth * 0.28 }
        ]}
        onPress={() => setSelectedFilter(filter)}
      >
        <Text style={[
          styles.filterText,
          isActive && styles.activeFilterText,
          { fontSize: screenWidth < 350 ? 12 : 14 }
        ]}>
          {title}
        </Text>
        {count > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <ServiceCard
      service={item}
      onEdit={openEditModal}
      onDelete={handleDelete}
      onToggle={handleToggleAvailability}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle}>Manage your laundry services</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, descriptions, apparel types..."
            placeholderTextColor={theme.colors.textSecondary}
            onChangeText={setSearchQuery}
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
              placeholder="Search services..."
              placeholderTextColor={theme.colors.textSecondary}
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
        </Animated.View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('available', 'Available')}
        {renderFilterButton('unavailable', 'Unavailable')}
      </View>

      <FlatList
        data={getFilteredServices()}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Filter size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No services found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first service to get started'}
            </Text>
          </View>
        }
      />

      <ServiceFormModal
        visible={modalVisible}
        formData={formData}
        editingService={editingService}
        onChange={setFormData}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  filterButton: {
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
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  filterText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeFilterText: {
    color: theme.colors.white,
  },
  filterBadge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
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