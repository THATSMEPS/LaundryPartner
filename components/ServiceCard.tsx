import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3, Trash2 } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import { Service } from '@/types/service';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  onToggle: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete, onToggle }) => (
  <Card style={styles.serviceCard}>
    <View style={styles.serviceHeader}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceCategory}>{service.apparelTypes || 'All Apparel Types'}</Text>
      </View>
      <View style={styles.serviceActions}>
        <Switch
          value={service.isAvailable}
          onValueChange={() => onToggle(service.id)}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={service.isAvailable ? theme.colors.white : theme.colors.textSecondary}
        />
      </View>
    </View>
    <Text style={styles.serviceDescription}>{service.description}</Text>
    <View style={styles.serviceDetails}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Price:</Text>
        <Text style={styles.detailValue}>{`₹${service.price}`}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Last Updated:</Text>
        <Text style={styles.detailValue}>{new Date(service.updatedAt).toLocaleDateString()}</Text>
      </View>
    </View>
    <View style={styles.serviceFooter}>
      <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => onEdit(service)}>
        <Edit3 size={16} color={theme.colors.primary} />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(service.id)}>
        <Trash2 size={16} color={theme.colors.error} />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </Card>
);

const styles = StyleSheet.create({
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
  serviceInfo: { flex: 1 },
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
  serviceActions: { marginLeft: theme.spacing.md },
  serviceDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  serviceDetails: { marginBottom: theme.spacing.md },
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
});

export default ServiceCard;
