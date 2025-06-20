import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { User, Building, Mail, Phone, MapPin, Clock, CreditCard, Settings, CircleHelp as HelpCircle, LogOut, CreditCard as Edit3, Save, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface ProfileData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  workingHours: {
    start: string;
    end: string;
  };
  notifications: {
    newOrders: boolean;
    payments: boolean;
    messages: boolean;
  };
}

const initialProfileData: ProfileData = {
  businessName: 'Clean & Fresh Laundry',
  ownerName: 'Rajesh Kumar',
  email: 'rajesh@cleanfresh.com',
  phone: '+91 98765 43210',
  address: 'Shop No. 15, Shela Market, Ahmedabad, Gujarat 380058',
  serviceArea: 'Shela, SG Highway, Gota, Bopal',
  workingHours: {
    start: '08:00',
    end: '20:00',
  },
  notifications: {
    newOrders: true,
    payments: true,
    messages: false,
  },
};

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData>(initialProfileData);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(profileData);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]
    );
  };

  const updateEditData = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNotificationSettings = (setting: keyof ProfileData['notifications'], value: boolean) => {
    setEditData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [setting]: value,
      },
    }));
  };

  const renderEditableField = (
    icon: React.ReactNode,
    label: string,
    value: string,
    field: string,
    placeholder?: string,
    multiline?: boolean
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.textArea]}
          value={value}
          onChangeText={(text) => updateEditData(field, text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );

  const renderNotificationToggle = (
    label: string,
    description: string,
    setting: keyof ProfileData['notifications']
  ) => (
    <View style={styles.notificationRow}>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationLabel}>{label}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        value={editData.notifications[setting]}
        onValueChange={(value) => updateNotificationSettings(setting, value)}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={editData.notifications[setting] ? theme.colors.white : theme.colors.textSecondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditToggle}
        >
          {isEditing ? (
            <X size={24} color={theme.colors.textPrimary} />
          ) : (
            <Edit3 size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Profile */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          {renderEditableField(
            <Building size={20} color={theme.colors.primary} />,
            'Business Name',
            editData.businessName,
            'businessName',
            'Enter business name'
          )}

          {renderEditableField(
            <User size={20} color={theme.colors.primary} />,
            'Owner Name',
            editData.ownerName,
            'ownerName',
            'Enter owner name'
          )}

          {renderEditableField(
            <Mail size={20} color={theme.colors.primary} />,
            'Email',
            editData.email,
            'email',
            'Enter email address'
          )}

          {renderEditableField(
            <Phone size={20} color={theme.colors.primary} />,
            'Phone Number',
            editData.phone,
            'phone',
            'Enter phone number'
          )}

          {renderEditableField(
            <MapPin size={20} color={theme.colors.primary} />,
            'Business Address',
            editData.address,
            'address',
            'Enter business address',
            true
          )}

          {renderEditableField(
            <MapPin size={20} color={theme.colors.secondary} />,
            'Service Area',
            editData.serviceArea,
            'serviceArea',
            'Enter service areas',
            true
          )}
        </Card>

        {/* Working Hours */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <View style={styles.workingHoursContainer}>
            <View style={styles.timeField}>
              <Clock size={20} color={theme.colors.primary} />
              <Text style={styles.timeLabel}>Start Time</Text>
              {isEditing ? (
                <TextInput
                  style={styles.timeInput}
                  value={editData.workingHours.start}
                  onChangeText={(text) => updateEditData('workingHours', { ...editData.workingHours, start: text })}
                  placeholder="08:00"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={styles.timeValue}>{editData.workingHours.start}</Text>
              )}
            </View>

            <View style={styles.timeField}>
              <Clock size={20} color={theme.colors.secondary} />
              <Text style={styles.timeLabel}>End Time</Text>
              {isEditing ? (
                <TextInput
                  style={styles.timeInput}
                  value={editData.workingHours.end}
                  onChangeText={(text) => updateEditData('workingHours', { ...editData.workingHours, end: text })}
                  placeholder="20:00"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={styles.timeValue}>{editData.workingHours.end}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          {renderNotificationToggle(
            'New Orders',
            'Get notified when you receive new orders',
            'newOrders'
          )}

          {renderNotificationToggle(
            'Payment Confirmations',
            'Get notified about payment updates',
            'payments'
          )}

          {renderNotificationToggle(
            'Customer Messages',
            'Get notified about customer messages',
            'messages'
          )}
        </Card>

        {/* Bank Details */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payout Details</Text>
            <TouchableOpacity style={styles.bankEditButton}>
              <CreditCard size={20} color={theme.colors.primary} />
              <Text style={styles.bankEditText}>Update Bank Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bankInfo}>
            <Text style={styles.bankText}>Account: •••• •••• •••• 4567</Text>
            <Text style={styles.bankText}>IFSC: HDFC0001234</Text>
          </View>
        </Card>

        {/* Support & Legal */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <HelpCircle size={20} color={theme.colors.textSecondary} />
            <Text style={styles.menuItemText}>Help & FAQ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color={theme.colors.textSecondary} />
            <Text style={styles.menuItemText}>Terms & Conditions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color={theme.colors.textSecondary} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </TouchableOpacity>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <View style={styles.editButtons}>
              <Button
                title="Cancel"
                onPress={handleEditToggle}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Save Changes"
                onPress={handleSave}
                style={styles.actionButton}
              />
            </View>
          ) : (
            <Button
              title="Logout"
              onPress={handleLogout}
              variant="danger"
              style={styles.logoutButton}
            />
          )}
        </View>
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
  editButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  fieldValue: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    paddingLeft: theme.spacing.xl,
  },
  fieldInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    marginLeft: theme.spacing.xl,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  workingHoursContainer: {
    gap: theme.spacing.lg,
  },
  timeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  timeValue: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    minWidth: 60,
  },
  timeInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    minWidth: 80,
    textAlign: 'center',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  notificationInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  notificationLabel: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  notificationDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  bankEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  bankEditText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  bankInfo: {
    gap: theme.spacing.sm,
  },
  bankText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  actionButtons: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  editButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  logoutButton: {
    width: '100%',
  },
});