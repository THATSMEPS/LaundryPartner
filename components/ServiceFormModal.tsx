import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TextInput, Switch, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Button from '@/components/Button';
import { Service } from '@/types/service';
import { getApparelTypes } from '@/utils/api';

interface ServiceFormModalProps {
  visible: boolean;
  formData: {
    name: string;
    description: string;
    price: string;
    apparelTypes: string[];
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
  // Apparel types dropdown logic
  const [apparelTypesList, setApparelTypesList] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await getApparelTypes();
        let data = res;
        if (Array.isArray(data)) {
          setApparelTypesList(data.map((item: any) => ({ label: item.typeName, value: item.id })));
        } else if (data && Array.isArray(data.data)) {
          setApparelTypesList(data.data.map((item: any) => ({ label: item.typeName, value: item.id })));
        }
      } catch (e) {
        setApparelTypesList([]);
      }
    })();
  }, []);


  // Multi-select searchable dropdown for apparel types
  const DropdownPicker = ({
    options,
    values,
    onChange,
    placeholder,
    searchable = false
  }: {
    options: { label: string; value: string }[];
    values: string[];
    onChange: (vals: string[]) => void;
    placeholder: string;
    searchable?: boolean;
  }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const dropdownRef = useRef<View>(null);
    const inputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Scroll into view when dropdown opens
    const scrollToInput = () => {
      if (dropdownRef.current && scrollViewRef.current) {
        dropdownRef.current.measure((fx, fy, width, height, px, py) => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: py - 100, animated: true });
          }
        });
      }
    };

    useEffect(() => {
      if (showDropdown) {
        setTimeout(scrollToInput, 100);
      }
    }, [showDropdown]);

    // Only show placeholder if any selected, not the selected values
    const displayLabels = () => {
      if (values.length > 0) return '';
      return '';
    };

    const handleSelect = (item: { label: string; value: string }) => {
      if (values.includes(item.value)) {
        onChange(values.filter(v => v !== item.value));
      } else {
        onChange([...values, item.value]);
      }
    };

    const toggleDropdown = () => {
      setShowDropdown(!showDropdown);
      if (!showDropdown) setSearchText('');
    };

    const handleInputBlur = () => {
      setTimeout(() => {
        setShowDropdown(false);
        setSearchText('');
      }, 300);
    };

    const handleSearchChange = (text: string) => {
      setSearchText(text);
      if (!showDropdown) setShowDropdown(true);
    };

    // Hide already selected items from dropdown when keyboard is open
    const filteredOptions = (searchable && searchText
      ? options.filter(opt => opt.label.toLowerCase().includes(searchText.toLowerCase()))
      : options
    ).filter(opt => !values.includes(opt.value));

    // Handle Enter/Done/Return key to select first filtered option
    const handleSubmitEditing = () => {
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
        setSearchText('');
      } else {
        setShowDropdown(false);
        setSearchText('');
      }
    };

    return (
      <View ref={dropdownRef}>
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  fontSize: 16,
                  minHeight: 54,
                  paddingVertical: 14,
                  paddingRight: 36, // space for dropdown arrow
                },
              ]}
              value={showDropdown ? searchText : displayLabels()}
              onFocus={() => {
                setShowDropdown(true);
                setSearchText('');
              }}
              onBlur={handleInputBlur}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSubmitEditing}
              placeholder={values.length > 0 ? 'Add more ...' : placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              editable={true}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <View style={{ position: 'absolute', right: 12, top: 14 }}>
              <Text style={{ color: theme.colors.textSecondary }}>{showDropdown ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
        {/* Dropdown below input, not overlapping */}
        {showDropdown && (
          <View style={{
            marginTop: 8,
            backgroundColor: theme.colors.white,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
            zIndex: 100,
            elevation: 8,
            maxHeight: 240,
            minHeight: 44,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}>
            <ScrollView keyboardShouldPersistTaps="always">
              {filteredOptions.length > 0 ? filteredOptions.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 14,
                    backgroundColor: theme.colors.white,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 16 }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )) : (
                <View style={{ padding: 16 }}>
                  <Text style={{ color: theme.colors.textSecondary }}>No results found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
        {/* Show selected as tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {options.filter(opt => values.includes(opt.value)).map(opt => (
            <View key={opt.value} style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 6,
              marginBottom: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{ color: theme.colors.white, fontSize: 13 }}>{opt.label}</Text>
              <TouchableOpacity onPress={() => onChange(values.filter(v => v !== opt.value))}>
                <Text style={{ color: theme.colors.white, marginLeft: 4 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

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
                  <DropdownPicker
                    options={apparelTypesList}
                    values={formData.apparelTypes}
                    onChange={vals => onChange({ ...formData, apparelTypes: vals })}
                    placeholder="Select apparel types..."
                    searchable={true}
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
