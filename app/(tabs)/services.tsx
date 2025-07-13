import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { FlatList as RNFlatList } from 'react-native';
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
  toggleLaundryItemAvailability, 
  getApparelTypes 
} from '@/utils/api';
import Toast from 'react-native-toast-message';

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAvailability, setSearchAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const screenWidth = Dimensions.get('window').width;
  const scrollY = new Animated.Value(0);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    apparelTypes: string[];
    isAvailable: boolean;
    state: string;
    area: string;
  }>({
    name: '',
    description: '',
    price: '',
    apparelTypes: [],
    isAvailable: true,
    state: '',
    area: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      apparelTypes: [],
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
      apparelTypes: Array.isArray(service.apparelTypes) ? service.apparelTypes : (typeof service.apparelTypes === 'string' ? service.apparelTypes.split(',').map((s: string) => s.trim()) : []),
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
      // Map apparel type IDs to names using apparelTypesList from ServiceFormModal
      // We'll need to pass apparelTypesList from ServiceFormModal as a prop or lift it up
      // For now, fetch the mapping here for correct payload
      let apparelTypeNameMap: Record<string, string> = {};
      try {
        const res = await getApparelTypes();
        let data = res;
        let list: { label: string; value: string }[] = Array.isArray(data)
          ? data.map((item: any) => ({ label: item.typeName, value: item.id }))
          : (data && Array.isArray(data.data)
            ? data.data.map((item: any) => ({ label: item.typeName, value: item.id }))
            : []);
        apparelTypeNameMap = Object.fromEntries(list.map((item: { label: string; value: string }) => [item.value, item.label]));
      } catch {}

      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        apparelTypes: formData.apparelTypes.map((id: string) => (apparelTypeNameMap[id] || id)),
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

  // Sort: available first, then unavailable
  const getSortedFilteredServices = () => {
    let filtered = services;
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.apparelTypes && service.apparelTypes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (searchAvailability !== 'all') {
      filtered = filtered.filter(service =>
        searchAvailability === 'available' ? service.isAvailable : !service.isAvailable
      );
    }
    // Sort available first
    return filtered.sort((a, b) => (a.isAvailable === b.isAvailable ? 0 : a.isAvailable ? -1 : 1));
  };

  // Remove filter tabs, move header and search bar into ListHeaderComponent
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle}>Manage your laundry services</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
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
          <TouchableOpacity
            style={styles.availabilityDropdown}
            onPress={() => {
              setSearchAvailability(
                searchAvailability === 'all'
                  ? 'available'
                  : searchAvailability === 'available'
                  ? 'unavailable'
                  : 'all'
              );
            }}
          >
            <Text style={styles.availabilityDropdownText}>
              {searchAvailability === 'all'
                ? 'All'
                : searchAvailability === 'available'
                ? 'Available'
                : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Floating search bar logic
  const [searchBarY, setSearchBarY] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowFloatingSearch(offsetY > searchBarY + 10);
      },
    }
  );

  // Measure search bar position
  const onSearchLayout = (e: any) => {
    setSearchBarY(e.nativeEvent.layout.y);
  };

  // Render search bar for floating
  const renderFloatingSearch = () => (
    <Animated.View style={styles.floatingSearchContainer}>
      <View style={styles.searchWrapper}>
        <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search services, descriptions, apparel types..."
          placeholderTextColor={theme.colors.textSecondary}
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
        <TouchableOpacity
          style={styles.availabilityDropdown}
          onPress={() => {
            setSearchAvailability(
              searchAvailability === 'all'
                ? 'available'
                : searchAvailability === 'available'
                ? 'unavailable'
                : 'all'
            );
          }}
        >
          <Text style={styles.availabilityDropdownText}>
            {searchAvailability === 'all'
              ? 'All'
              : searchAvailability === 'available'
              ? 'Available'
              : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

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
      <Animated.FlatList
        data={getSortedFilteredServices()}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View onLayout={onSearchLayout}>
            {/* Header and search bar scroll with content */}
            {renderHeader()}
            {/* Only show search bar if floating search is not visible */}
            {!showFloatingSearch && null}
          </View>
        }
        onScroll={handleScroll}
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
      {/* Floating search bar */}
      {showFloatingSearch && renderFloatingSearch()}
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
  availabilityDropdown: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityDropdownText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
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