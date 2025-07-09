import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Plus } from 'lucide-react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

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
      <View style={styles.header}>
        <Text style={styles.title}>Services Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
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
  listContainer: {
    paddingVertical: theme.spacing.md,
  },
});