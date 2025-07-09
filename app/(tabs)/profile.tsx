import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { getPartnerProfile, updatePartnerProfile } from '@/utils/api';

interface ProfileData {
  businessName: string;
  
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  workingHours: {
    openTime: string;
    closeTime: string;
  };
  notifications: {
    newOrders: boolean;
    payments: boolean;
    messages: boolean;
  };
}

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      // console.log('Loaded token:', token);
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const res = await getPartnerProfile();
        // console.log('Fetched profile data:', res);
        const apiData = res.data;
        const mappedProfile: ProfileData = {
          businessName: apiData.name || '',
          // ownerName: '', // Not present in backend, set as empty or fetch if available
          email: apiData.email || '',
          phone: apiData.mobile || '',
          address: apiData.address || '',
          serviceArea: apiData.areaId || '',
          workingHours: {
            openTime: (apiData.hours && apiData.hours.openTime) ? apiData.hours.openTime : '',
            closeTime: (apiData.hours && apiData.hours.closeTime) ? apiData.hours.closeTime : '',
          },
          notifications: {
            newOrders: false,
            payments: false,
            messages: false,
          },
        };
        setProfileData(mappedProfile);
        setEditData(mappedProfile);
      } catch (e) {
        console.log('Error fetching profile:', e);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEditToggle = () => {
    console.log('Toggling edit mode. Current isEditing:', isEditing);
    if (isEditing && profileData) {
      setEditData(profileData);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!editData) return;
    console.log('Saving profile with data:', editData);
    try {
      const updated = await updatePartnerProfile(editData);
      console.log('Profile updated:', updated);
      setProfileData(updated);
      setEditData(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      console.log('Error updating profile:', e);
      Alert.alert('Error', e.message || 'Failed to update profile');
    }
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
    console.log('Updating field', field, 'with value', value);
    setEditData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const updateNotificationSettings = (setting: keyof ProfileData['notifications'], value: boolean) => {
    console.log('Updating notification setting', setting, 'to', value);
    setEditData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [setting]: value,
        },
      };
    });
  };

  const renderEditableField = (
    icon: React.ReactNode,
    label: string,
    value: string | undefined,
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
          value={value || ''}
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
        value={!!editData?.notifications?.[setting]}
        onValueChange={(value) => updateNotificationSettings(setting, value)}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={editData?.notifications?.[setting] ? theme.colors.white : theme.colors.textSecondary}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 40}}>Loading...</Text>
      </SafeAreaView>
    );
  }
  if (!profileData || !editData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign: 'center', marginTop: 40}}>No profile data found.</Text>
      </SafeAreaView>
    );
  }

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

          {/* {renderEditableField(
            <User size={20} color={theme.colors.primary} />,
            'Owner Name',
            editData.ownerName,
            'ownerName',
            'Enter owner name'
          )} */}

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
              <Text style={styles.timeLabel}>Open Time</Text>
              {isEditing ? (
                <TextInput
                  style={styles.timeInput}
                  value={editData.workingHours?.openTime || ''}
                  onChangeText={(text) => updateEditData('workingHours', { ...((editData.workingHours || { openTime: '', closeTime: '' })), openTime: text })}
                  placeholder="08:00"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={styles.timeValue}>{editData.workingHours?.openTime || ''}</Text>
              )}
            </View>

            <View style={styles.timeField}>
              <Clock size={20} color={theme.colors.secondary} />
              <Text style={styles.timeLabel}>Close Time</Text>
              {isEditing ? (
                <TextInput
                  style={styles.timeInput}
                  value={editData.workingHours?.closeTime || ''}
                  onChangeText={(text) => updateEditData('workingHours', { ...((editData.workingHours || { openTime: '', closeTime: '' })), closeTime: text })}
                  placeholder="20:00"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={styles.timeValue}>{editData.workingHours?.closeTime || ''}</Text>
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