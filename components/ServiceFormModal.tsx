import React from 'react';
import { View, Text, Modal, TextInput, Switch, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Button from '@/components/Button';
import { Service } from '@/types/service';

interface ServiceFormModalProps {
  visible: boolean;
  formData: {
    name: string;
    description: string;
    price: string;
    apparelTypes: string;
    isAvailable: boolean;
  };
  editingService: Service | null;
  onChange: (data: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  visible,
  formData,
  editingService,
  onChange,
  onClose,
  onSave,
}) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingService ? 'Edit Service' : 'Add New Service'}</Text>
                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                  <X size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Service Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => onChange({ ...formData, name: text })}
                    placeholder="Enter service name"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => onChange({ ...formData, description: text })}
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
                    onChangeText={(text) => onChange({ ...formData, price: text })}
                    placeholder="Enter price"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Apparel Types</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.apparelTypes}
                    onChangeText={(text) => onChange({ ...formData, apparelTypes: text })}
                    placeholder="e.g., Cotton,Silk,Wool"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Available</Text>
                  <Switch
                    value={formData.isAvailable}
                    onValueChange={(value) => onChange({ ...formData, isAvailable: value })}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={formData.isAvailable ? theme.colors.white : theme.colors.textSecondary}
                  />
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <Button title="Cancel" onPress={onClose} variant="outline" style={styles.modalButton} />
                <Button title={editingService ? 'Update' : 'Create'} onPress={onSave} style={styles.modalButton} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
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

export default ServiceFormModal;
