import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  SafeAreaView,
} from 'react-native';
import { Plus, CreditCard as Edit3, Trash2, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  pricingModel: 'per_kg' | 'per_piece' | 'flat_rate';
  turnaroundTime: string;
  isActive: boolean;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Wash & Fold',
    description: 'Basic washing and folding service',
    category: 'Regular Wash',
    price: 50,
    pricingModel: 'per_kg',
    turnaroundTime: '24 hours',
    isActive: true,
  },
  {
    id: '2',
    name: 'Dry Cleaning',
    description: 'Professional dry cleaning for delicate items',
    category: 'Premium',
    price: 80,
    pricingModel: 'per_piece',
    turnaroundTime: '48 hours',
    isActive: true,
  },
  {
    id: '3',
    name: 'Express Wash',
    description: 'Quick wash service for urgent needs',
    category: 'Express',
    price: 150,
    pricingModel: 'flat_rate',
    turnaroundTime: '6 hours',
    isActive: false,
  },
];

const categories = ['Regular Wash', 'Premium', 'Express', 'Ethnic Wear', 'Formal', 'Kids'];
const pricingModels = [
  { value: 'per_piece', label: 'Per Piece' },
];

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    price: string;
    pricingModel: 'per_piece';
    turnaroundTime: string;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    category: categories[0],
    price: '',
    pricingModel: 'per_piece',
    turnaroundTime: '',
    isActive: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: categories[0],
      price: '',
      pricingModel: 'per_piece',
      turnaroundTime: '',
      isActive: true,
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
      category: service.category,
      price: service.price.toString(),
      pricingModel: 'per_piece',
      turnaroundTime: service.turnaroundTime,
      isActive: service.isActive,
    });
    setEditingService(service);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.description || !formData.price || !formData.turnaroundTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const serviceData = {
      id: editingService?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price),
      pricingModel: formData.pricingModel,
      turnaroundTime: formData.turnaroundTime,
      isActive: formData.isActive,
    };

    if (editingService) {
      setServices(prev =>
        prev.map(service =>
          service.id === editingService.id ? serviceData : service
        )
      );
    } else {
      setServices(prev => [...prev, serviceData]);
    }

    setModalVisible(false);
    resetForm();
    Alert.alert('Success', `Service ${editingService ? 'updated' : 'created'} successfully`);
  };

  const handleDelete = (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setServices(prev => prev.filter(service => service.id !== serviceId));
            Alert.alert('Success', 'Service deleted successfully');
          },
        },
      ]
    );
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, isActive: !service.isActive } : service
      )
    );
  };

  const getPriceDisplay = (service: Service) => {
    switch (service.pricingModel) {
      case 'per_kg':
        return `₹${service.price}/kg`;
      case 'per_piece':
        return `₹${service.price}/piece`;
      case 'flat_rate':
        return `₹${service.price}`;
      default:
        return `₹${service.price}`;
    }
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <Card style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
        </View>
        <View style={styles.serviceActions}>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleServiceStatus(item.id)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={item.isActive ? theme.colors.white : theme.colors.textSecondary}
          />
        </View>
      </View>

      <Text style={styles.serviceDescription}>{item.description}</Text>

      <View style={styles.serviceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>{getPriceDisplay(item)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Turnaround:</Text>
          <Text style={styles.detailValue}>{item.turnaroundTime}</Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Edit3 size={16} color={theme.colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={16} color={theme.colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or category"
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter service name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter service description"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="Enter price"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Turnaround Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.turnaroundTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, turnaroundTime: text }))}
                placeholder="e.g., 24 hours"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Active Service</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={formData.isActive ? theme.colors.white : theme.colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => setModalVisible(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={editingService ? 'Update' : 'Create'}
              onPress={handleSave}
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
  serviceCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  serviceCategory: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  serviceActions: {
    marginLeft: theme.spacing.md,
  },
  serviceDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  serviceDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  serviceFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  editButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'green',
  },
  searchContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  deleteButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  editButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  deleteButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    fontWeight: '600',
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
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  modalButton: {
    flex: 1,
  },
});