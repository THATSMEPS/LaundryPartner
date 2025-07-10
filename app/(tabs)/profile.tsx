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
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { User, Building, Mail, Phone, MapPin, Clock, CreditCard, Settings, CircleHelp as HelpCircle, LogOut, CreditCard as Edit3, Save, X, ChevronDown, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { getPartnerProfile, updatePartnerProfile, getAreas } from '@/utils/api';
import { getItem, setItem } from '@/utils/storage';

interface ProfileData {
  businessName: string;
  email: string;
  phone: string;
  address: {
    shopNumber: string;
    street: string;
    landmark: string;
    pincode: string;
  } | string;
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
  const [areas, setAreas] = useState<{ id: string; areaName: string }[]>([]);
  
  // Time picker states
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [openTime, setOpenTime] = useState(new Date());
  const [closeTime, setCloseTime] = useState(new Date());
  
  // Area dropdown states
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [areaSearchText, setAreaSearchText] = useState('');
  const [filteredAreas, setFilteredAreas] = useState<{ id: string; areaName: string }[]>([]);

  // Load areas from storage or API
  useEffect(() => {
    (async () => {
      let loadedAreas = await getItem('areas');
      if (!loadedAreas || !Array.isArray(loadedAreas) || loadedAreas.length === 0) {
        try {
          const res = await getAreas();
          let areasData = [];
          if (Array.isArray(res)) {
            areasData = res;
          } else if (res && typeof res === 'object') {
            if (res.data && Array.isArray(res.data)) {
              areasData = res.data;
            } else if (res.areas && Array.isArray(res.areas)) {
              areasData = res.areas;
            }
          }
          const validAreas = areasData.filter((area: any) => area && area.id && area.areaName);
          setAreas(validAreas);
          setFilteredAreas(validAreas);
          await setItem('areas', validAreas);
        } catch (e) {
          setAreas([]);
          setFilteredAreas([]);
        }
      } else {
        setAreas(loadedAreas);
        setFilteredAreas(loadedAreas);
      }
    })();
  }, []);

  // Filter areas based on search text
  useEffect(() => {
    if (areaSearchText.trim() === '') {
      setFilteredAreas(areas);
    } else {
      const filtered = areas.filter(area => 
        area.areaName.toLowerCase().includes(areaSearchText.toLowerCase())
      );
      setFilteredAreas(filtered);
    }
  }, [areaSearchText, areas]);

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
          email: apiData.email || '',
          phone: apiData.mobile || '',
          address: apiData.address || {
            shopNumber: '',
            street: '',
            landmark: '',
            pincode: ''
          },
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
        
        // Initialize time pickers with current data or defaults
        if (mappedProfile.workingHours?.openTime) {
          const [hours, minutes] = mappedProfile.workingHours.openTime.split(':');
          const openDate = new Date();
          openDate.setHours(parseInt(hours), parseInt(minutes));
          setOpenTime(openDate);
        } else {
          const defaultOpen = new Date();
          defaultOpen.setHours(8, 0);
          setOpenTime(defaultOpen);
        }
        
        if (mappedProfile.workingHours?.closeTime) {
          const [hours, minutes] = mappedProfile.workingHours.closeTime.split(':');
          const closeDate = new Date();
          closeDate.setHours(parseInt(hours), parseInt(minutes));
          setCloseTime(closeDate);
        } else {
          const defaultClose = new Date();
          defaultClose.setHours(20, 0);
          setCloseTime(defaultClose);
        }
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
      // Reset area search when canceling edit
      setAreaSearchText('');
      setShowAreaDropdown(false);
    }
    setIsEditing(!isEditing);
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Handle time picker changes
  const handleOpenTimeChange = (event: any, selectedDate?: Date) => {
    setShowOpenTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setOpenTime(selectedDate);
      const timeString = formatTime(selectedDate);
      updateEditData('workingHours', {
        ...((editData?.workingHours || { openTime: '', closeTime: '' })),
        openTime: timeString
      });
    }
  };

  const handleCloseTimeChange = (event: any, selectedDate?: Date) => {
    setShowCloseTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCloseTime(selectedDate);
      const timeString = formatTime(selectedDate);
      updateEditData('workingHours', {
        ...((editData?.workingHours || { openTime: '', closeTime: '' })),
        closeTime: timeString
      });
    }
  };

  // Handle area selection
  const handleAreaSelect = (area: { id: string; areaName: string }) => {
    updateEditData('serviceArea', area.id);
    setAreaSearchText(area.areaName);
    setShowAreaDropdown(false);
  };

  const handleSave = async () => {
    if (!editData) return;
    
    try {
      // Prepare payload for backend with proper field mappings
      const payload: any = {
        name: editData.businessName,
        email: editData.email,
        mobile: editData.phone,
      };

      // Handle address - properly format with required fields
      if (typeof editData.address === 'object') {
        // Get area information for address
        const selectedArea = areas.find(a => a.id === editData.serviceArea);
        
        payload.address = {
          shopNumber: editData.address.shopNumber || '',
          street: editData.address.street || '',
          landmark: editData.address.landmark || '',
          pincode: editData.address.pincode || '',
          detailedAddress: `${editData.address.shopNumber || ''} ${editData.address.street || ''} ${editData.address.landmark || ''}`.trim(),
          area: selectedArea?.areaName || '',
          city: 'Ahmedabad', // Default city - you might want to make this configurable
          state: 'Gujarat' // Default state - you might want to make this configurable
        };
      } else {
        // If it's a string, convert to proper format
        const selectedArea = areas.find(a => a.id === editData.serviceArea);
        payload.address = {
          shopNumber: '',
          street: editData.address || '',
          landmark: '',
          pincode: '',
          detailedAddress: editData.address || '',
          area: selectedArea?.areaName || '',
          city: 'Ahmedabad',
          state: 'Gujarat'
        };
      }

      // Handle area mapping - ensure we send the correct areaId
      if (editData.serviceArea) {
        const areaObj = areas.find(a => a.areaName === editData.serviceArea || a.id === editData.serviceArea);
        payload.areaId = areaObj ? areaObj.id : editData.serviceArea;
      }

      // Handle working hours if they exist
      if (editData.workingHours && (editData.workingHours.openTime || editData.workingHours.closeTime)) {
        payload.hours = {
          openTime: editData.workingHours.openTime || '',
          closeTime: editData.workingHours.closeTime || ''
        };
      }

      console.log('Sending payload to backend:', payload);
      
      const updated = await updatePartnerProfile(payload);
      console.log('Profile updated successfully:', updated);
      
      // Map the backend response back to frontend format
      const mappedUpdatedProfile: ProfileData = {
        businessName: updated.data?.name || payload.name,
        email: updated.data?.email || payload.email,
        phone: updated.data?.mobile || payload.mobile,
        address: updated.data?.address || payload.address,
        serviceArea: updated.data?.areaId || payload.areaId,
        workingHours: {
          openTime: (updated.data?.hours && updated.data.hours.openTime) ? updated.data.hours.openTime : (payload.hours?.openTime || ''),
          closeTime: (updated.data?.hours && updated.data.hours.closeTime) ? updated.data.hours.closeTime : (payload.hours?.closeTime || ''),
        },
        notifications: editData.notifications, // Keep existing notification settings
      };
      
      setProfileData(mappedUpdatedProfile);
      setEditData(mappedUpdatedProfile);
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
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('partner');
              router.replace('/login');
            } catch (error) {
              console.log('Error during logout:', error);
              router.replace('/login');
            }
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

  // Dropdown for area selection in edit mode
  const renderAreaField = () => {
    if (!editData) return null;
    
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <MapPin size={20} color={theme.colors.secondary} />
          <Text style={styles.fieldLabel}>Service Area</Text>
        </View>
        {isEditing ? (
          <View style={styles.areaInputContainer}>
            <TouchableOpacity
              style={styles.areaInputField}
              onPress={() => {
                setShowAreaDropdown(!showAreaDropdown);
                if (!showAreaDropdown) {
                  setAreaSearchText(getAreaName(editData.serviceArea) || '');
                }
              }}
            >
              <Text style={[
                styles.areaInputText,
                !getAreaName(editData.serviceArea) && styles.areaPlaceholder
              ]}>
                {getAreaName(editData.serviceArea) || 'Select service area'}
              </Text>
              <ChevronDown 
                size={20} 
                color={theme.colors.textSecondary}
                style={[
                  styles.areaDropdownIcon,
                  showAreaDropdown && { transform: [{ rotate: '180deg' }] }
                ]}
              />
            </TouchableOpacity>
            
            {showAreaDropdown && (
              <View style={styles.areaDropdownOverlay}>
                <View style={styles.areaSearchContainer}>
                  <TextInput
                    style={styles.areaSearchInput}
                    value={areaSearchText}
                    onChangeText={setAreaSearchText}
                    placeholder="Search areas..."
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <ScrollView 
                  style={styles.areaDropdownList}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredAreas.length > 0 ? (
                    filteredAreas.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.areaDropdownItem,
                          editData.serviceArea === item.id && styles.selectedAreaDropdownItem
                        ]}
                        onPress={() => handleAreaSelect(item)}
                      >
                        <Text style={[
                          styles.areaDropdownItemText,
                          editData.serviceArea === item.id && styles.selectedAreaDropdownItemText
                        ]}>
                          {item.areaName}
                        </Text>
                        {editData.serviceArea === item.id && (
                          <Check size={16} color={theme.colors.white} />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noAreasText}>No areas found</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.fieldValue}>
            {getAreaName(editData.serviceArea) || 'No area selected'}
          </Text>
        )}
      </View>
    );
  };

  // Helper to get address as string
  const getAddressString = (address: ProfileData['address']): string => {
    if (typeof address === 'string') {
      return address;
    }
    if (address && typeof address === 'object') {
      const parts = [
        address.shopNumber,
        address.street,
        address.landmark,
        address.pincode
      ].filter(Boolean);
      return parts.join(', ');
    }
    return '';
  };

  // Helper to update address
  const updateAddress = (field: 'shopNumber' | 'street' | 'landmark' | 'pincode' | 'full', value: string) => {
    setEditData(prev => {
      if (!prev) return prev;
      
      if (field === 'full') {
        // Update full address as string
        return {
          ...prev,
          address: value
        };
      }
      
      // Update specific address field
      const currentAddress = typeof prev.address === 'object' ? prev.address : {
        shopNumber: '',
        street: prev.address || '',
        landmark: '',
        pincode: ''
      };
      
      return {
        ...prev,
        address: {
          ...currentAddress,
          [field]: value
        }
      };
    });
  };

  // Helper to get area name from id
  const getAreaName = (areaId: string) => {
    const found = areas.find(a => a.id === areaId);
    return found ? found.areaName : areaId;
  };

  // Custom address field renderer
  const renderAddressField = () => {
    if (!editData) return null;
    
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <MapPin size={20} color={theme.colors.primary} />
          <Text style={styles.fieldLabel}>Business Address</Text>
        </View>
        {isEditing ? (
          <View style={styles.addressContainer}>
            <TextInput
              style={[styles.fieldInput, { marginLeft: 0 }]}
              value={typeof editData.address === 'object' ? editData.address.shopNumber : ''}
              onChangeText={(text) => updateAddress('shopNumber', text)}
              placeholder="Shop Number"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.fieldInput, { marginLeft: 0 }]}
              value={typeof editData.address === 'object' ? editData.address.street : editData.address}
              onChangeText={(text) => updateAddress('street', text)}
              placeholder="Street Address"
              placeholderTextColor={theme.colors.textSecondary}
              multiline={true}
              numberOfLines={2}
            />
            <TextInput
              style={[styles.fieldInput, { marginLeft: 0 }]}
              value={typeof editData.address === 'object' ? editData.address.landmark : ''}
              onChangeText={(text) => updateAddress('landmark', text)}
              placeholder="Landmark"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.fieldInput, { marginLeft: 0 }]}
              value={typeof editData.address === 'object' ? editData.address.pincode : ''}
              onChangeText={(text) => updateAddress('pincode', text)}
              placeholder="Pincode"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        ) : (
          <Text style={styles.fieldValue}>{getAddressString(editData.address)}</Text>
        )}
      </View>
    );
  };

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
        {isEditing ? (
          <View style={styles.editHeaderButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleEditToggle}
            >
              <X size={20} color={theme.colors.error} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Save size={20} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditToggle}
          >
            <Edit3 size={20} color={theme.colors.white} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={() => {
          if (showAreaDropdown) {
            setShowAreaDropdown(false);
            setAreaSearchText('');
          }
        }}
        scrollEventThrottle={16}
      >
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

          {renderAddressField()}

          {renderAreaField()}
        </Card>

        {/* Working Hours */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <View style={styles.workingHoursContainer}>
            <View style={styles.timeField}>
              <Clock size={20} color={theme.colors.primary} />
              <Text style={styles.timeLabel}>Open Time</Text>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.timeInputButton}
                  onPress={() => setShowOpenTimePicker(true)}
                >
                  <Text style={styles.timeInputText}>
                    {editData?.workingHours?.openTime || '8:00'}
                  </Text>
                  <Clock size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.timeValue}>
                  {editData?.workingHours?.openTime || 'Not set'}
                </Text>
              )}
            </View>

            <View style={styles.timeField}>
              <Clock size={20} color={theme.colors.secondary} />
              <Text style={styles.timeLabel}>Close Time</Text>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.timeInputButton}
                  onPress={() => setShowCloseTimePicker(true)}
                >
                  <Text style={styles.timeInputText}>
                    {editData?.workingHours?.closeTime || '20:00'}
                  </Text>
                  <Clock size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.timeValue}>
                  {editData?.workingHours?.closeTime || 'Not set'}
                </Text>
              )}
            </View>
            
            {/* Time Pickers */}
            {showOpenTimePicker && (
              <DateTimePicker
                value={openTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleOpenTimeChange}
              />
            )}
            
            {showCloseTimePicker && (
              <DateTimePicker
                value={closeTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleCloseTimeChange}
              />
            )}
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
        {/* <Card style={styles.section}>
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
        </Card> */}

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
        {!isEditing && (
          <View style={styles.actionButtons}>
            <Button
              title="Logout"
              onPress={handleLogout}
              variant="danger"
              style={styles.logoutButton}
            />
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  editButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.white,
    fontWeight: '600',
  },
  editHeaderButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.white,
    fontWeight: '600',
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
  addressContainer: {
    marginLeft: theme.spacing.xl,
    gap: theme.spacing.sm,
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
  timeInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    minWidth: 100,
  },
  timeInputText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  // Area dropdown styles
  areaInputContainer: {
    marginLeft: theme.spacing.xl,
    position: 'relative',
    zIndex: 1000,
  },
  areaInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  areaInputText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  areaPlaceholder: {
    color: theme.colors.textSecondary,
  },
  areaDropdownIcon: {
    marginLeft: theme.spacing.sm,
  },
  areaDropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginTop: 2,
    maxHeight: 200,
    zIndex: 1001,
    ...theme.shadows.md,
  },
  areaSearchContainer: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  areaSearchInput: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  areaDropdownList: {
    maxHeight: 150,
  },
  areaDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  selectedAreaDropdownItem: {
    backgroundColor: theme.colors.primary,
  },
  areaDropdownItemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  selectedAreaDropdownItemText: {
    color: theme.colors.white,
  },
  noAreasText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.lg,
    fontStyle: 'italic',
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
  // Old styles kept for backward compatibility - to be removed
  areaDropdownContainer: {
    marginLeft: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  currentAreaText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  areaList: {
    maxHeight: 150,
  },
  areaOption: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  selectedAreaOption: {
    backgroundColor: theme.colors.primary,
  },
  areaOptionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  selectedAreaOptionText: {
    color: theme.colors.white,
  },
});