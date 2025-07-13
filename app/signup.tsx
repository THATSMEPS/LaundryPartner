import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Truck, Upload } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { registerPartner, getAreas, uploadPartnerBanner } from '@/utils/api';
import { setItem } from '@/utils/storage';
import { validateEmail, validatePhone, restrictPhoneInput } from '@/utils/validation';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    // ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      pincode: '',
      state: '', // Default blank
    },
    areaId: '', // Default blank
    // apparelTypes: [] as string[],
    operating_radius: 5,
  });
  // Allow areas to have extra fields for autofill
  const [areas, setAreas] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Apparel types logic removed from signup

  // Apparel types picker removed from signup

  // Fixed DropdownPicker component
const DropdownPicker = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  searchable = false
}: { 
  options: { label: string; value: string }[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string,
  searchable?: boolean
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<View>(null);

  // Find the label for the current value
  const displayLabel = () => {
    const found = options.find(opt => opt.value === value);
    return found ? found.label : '';
  };

  const handleSelect = (item: { label: string; value: string }) => {
    onChange(item.value);
    setSearchText(''); // Clear search text immediately
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const toggleDropdown = () => {
    if (!showDropdown) {
      setShowDropdown(true);
      // Clear search text when opening dropdown
      setSearchText('');
    } else {
      setShowDropdown(false);
      setSearchText('');
      Keyboard.dismiss();
    }
  };

  const handleInputBlur = () => {
    // Longer delay to allow for item selection when keyboard is open
    setTimeout(() => {
      setShowDropdown(false);
      setSearchText('');
    }, 500);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  // Filter options if searchable
  const filteredOptions = searchable && searchText
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  // Handle Submit/Done key press for selection
  const handleSubmitEditing = () => {
    if (searchable && searchText && filteredOptions.length > 0) {
      // Select the first matching option
      handleSelect(filteredOptions[0]);
    } else {
      // Just close dropdown and keyboard
      setShowDropdown(false);
      setSearchText('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Dropdown button or input */}
      {searchable ? (
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View>
            <TextInput
              style={styles.input}
              value={showDropdown ? searchText : (displayLabel() || '')}
              onFocus={() => {
                setShowDropdown(true);
                setSearchText('');
              }}
              onBlur={handleInputBlur}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSubmitEditing} // Handle Done key
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <View style={{ position: 'absolute', right: 12, top: 14 }}>
              <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      ) : (
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <View style={styles.pickerButtonContent}>
            <Text 
              style={value ? styles.pickerSelectedText : styles.pickerPlaceholderText}
              numberOfLines={1}
            >
              {displayLabel() || placeholder}
            </Text>
            <View style={styles.dropdownIcon}>
              <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Dropdown options */}
      {showDropdown && (
        <View 
          ref={dropdownRef}
          style={styles.dropdownListContainer}
        >
          <ScrollView 
            style={styles.dropdownList}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.length > 0 ? filteredOptions.map(item => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.dropdownItem,
                  value === item.value && styles.selectedOptionItem
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    styles.dropdownText,
                    value === item.value && styles.selectedOptionText
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )) : (
              <View style={{ padding: 16 }}>
                <Text style={styles.dropdownText}>No results found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};


  useEffect(() => {
    (async () => {
      try {
        // console.log("Fetching areas...");
        const res = await getAreas();
        // console.log("Areas API response:", res);
        
        // Handle various possible response structures
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
        
        // Make sure each area has the required properties
        const validAreas = areasData.filter(
          (area: any) => area && area.id && area.areaName
        );
        
        // console.log("Processed areas data:", validAreas);
        
        if (validAreas.length > 0) {
          setAreas(validAreas);
          await setItem('areas', validAreas);
        } else {
          // console.log("No valid areas data found, using fallback");
          // Fallback data in case API returns empty
          const fallbackAreas = [
            { id: "area1", areaName: "Ahmedabad" },
            { id: "area2", areaName: "Surat" },
            { id: "area3", areaName: "Vadodara" },
            { id: "area4", areaName: "Rajkot" },
            { id: "area5", areaName: "Gandhinagar" }
          ];
          setAreas(fallbackAreas);
          await setItem('areas', fallbackAreas);
        }
      } catch (e) {
        console.error("Error fetching areas:", e);
        // Fallback data if API fails
        const fallbackAreas = [
          { id: "area1", areaName: "Ahmedabad" },
          { id: "area2", areaName: "Surat" },
          { id: "area3", areaName: "Vadodara" },
          { id: "area4", areaName: "Rajkot" },
          { id: "area5", areaName: "Gandhinagar" }
        ];
        setAreas(fallbackAreas);
        await setItem('areas', fallbackAreas);
      }
    })();
  }, []);

  // Remove auto-select for areaId, keep blank until user selects

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      setFormData(prev => ({ ...prev, [field]: restrictPhoneInput(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    // Check all fields in formData and address (convert all to string and trim)
    const requiredFields = [
      formData.businessName,
      // formData.ownerName,
      formData.email,
      formData.phone,
      formData.password,
      formData.confirmPassword,
      formData.address.street,
      formData.address.city,
      formData.address.pincode,
      formData.address.state,
      formData.areaId,
      // formData.apparelTypes.length > 0 ? 'has_apparel_types' : '',
      formData.operating_radius
    ];
    // Enhanced: check for empty, undefined, null, whitespace, or zero for numeric fields
    const hasEmpty = requiredFields.some(field => {
      if (typeof field === 'number') {
        return isNaN(field) || field === 0;
      }
      return String(field).trim() === '' || field === undefined || field === null;
    });
    if (hasEmpty) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!validatePhone(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const regData = {
        email: formData.email,
        password: formData.password,
        name: formData.businessName,
        mobile: formData.phone,
        address: formData.address.street + ', ' + formData.address.city + ', ' + formData.address.pincode,
        areaId: formData.areaId,
        operating_radius: Number(formData.operating_radius),
      };
      const response = await registerPartner(regData);
      // console.log('registerPartner response:', response);
      const email = response?.data?.email || formData.email;
      // Store profile image URI in local storage for later upload after OTP verification
      if (profileImage) {
        try {
          await setItem('pendingProfileImage', profileImage);
        } catch (e) {
          console.warn('Failed to store profile image for later upload:', e);
        }
      }
      Alert.alert('Success', 'Verification OTP sent to your email. Please verify to complete registration.');
      router.push({ pathname: '/otp-verification', params: { email } });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Truck size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Laundry Partner</Text>
          <Text style={styles.subtitle}>Join our partner network</Text>
        </View>
        <View style={styles.form}>
          <View style={[styles.inputContainer, { zIndex: 1 }]}> 
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={formData.businessName}
              onChangeText={(value) => handleInputChange('businessName', value)}
              placeholder="Enter your business name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 19 }]}> 
            <Text style={styles.label}>Mobile</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter your mobile number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Text style={styles.sectionTitle}>Address Information</Text>
          <View style={[styles.inputContainer, { zIndex: 4 }]}> 
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={formData.address.street}
              onChangeText={(value) => setFormData(prev => ({ ...prev, address: { ...prev.address, street: value } }))}
              placeholder="Enter street address"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 19 }]}> 
            <Text style={styles.label}>Service Area</Text>
            <DropdownPicker
              options={areas.map(area => ({ label: area.areaName, value: area.id }))}
              value={formData.areaId}
              onChange={val => {
                setFormData(prev => {
                  const selectedArea = areas.find(a => a.id === val);
                  if (selectedArea) {
                    // Extract city from areaName (e.g., "Dariapur (Ahmedabad)" -> "Ahmedabad")
                    const cityMatch = selectedArea.areaName.match(/\(([^)]+)\)/);
                    const cityName = cityMatch ? cityMatch[1] : selectedArea.city || '';
                    
                    return {
                      ...prev,
                      areaId: val,
                      address: {
                        ...prev.address,
                        pincode: selectedArea.pincode?.toString() || '',
                        city: cityName,
                        state: selectedArea.state || 'Gujarat', // Default to Gujarat if not provided
                      }
                    };
                  }
                  return { ...prev, areaId: val };
                });
              }}
              placeholder="Select service area"
              searchable={true}
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 6 }]}> 
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={formData.address.pincode}
              onChangeText={(value) => setFormData(prev => ({ ...prev, address: { ...prev.address, pincode: value } }))}
              placeholder="Enter pincode"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 5 }]}> 
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.address.city}
              onChangeText={(value) => setFormData(prev => ({ ...prev, address: { ...prev.address, city: value } }))}
              placeholder="Enter city"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 20 }]}> 
            <Text style={styles.label}>State</Text>
            <DropdownPicker
              options={[
                { label: 'Gujarat', value: 'Gujarat' },
                { label: 'Maharashtra', value: 'Maharashtra' },
                { label: 'Delhi', value: 'Delhi' },
                { label: 'Karnataka', value: 'Karnataka' },
                { label: 'Tamil Nadu', value: 'Tamil Nadu' },
              ]}
              value={formData.address.state}
              onChange={val => setFormData(prev => ({ ...prev, address: { ...prev.address, state: val } }))}
              placeholder="Select state"
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 18 }]}>
            <Text style={styles.label}>Operating Radius (km)</Text>
            <TextInput
              style={styles.input}
              value={formData.operating_radius.toString()}
              onChangeText={(value) => handleInputChange('operating_radius', value)}
              placeholder="Enter operating radius in km"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>
          {/* Apparel Types field removed from signup */}
          <View style={[styles.inputContainer, { zIndex: 16 }]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputContainer, { zIndex: 15 }]}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputContainer, { zIndex: 14 }]}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputContainer, { zIndex: 30 }]}> 
            <Text style={styles.label}>Profile Photo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.profilePhotoContainer}>
              {profileImage ? (
                <View style={styles.profileImageWrapper}>
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  <View style={styles.profileImageOverlay}>
                    <Upload size={20} color={theme.colors.white} />
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Upload size={24} color={theme.colors.textSecondary} />
                  <Text style={styles.uploadPlaceholderText}>Upload profile photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}
          </View>
          <Button
            title="Create Account"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  form: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    height: 48,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  picker: {
    height: 48,
    width: '100%',
  },
  dropdownInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    height: 48,
    ...theme.typography.body,
    justifyContent: 'center',
  },
  dropdownContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  dropdownText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '400',
  },
  dropdownPlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    height: 48,
  },
  eyeButton: {
    padding: theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  switchButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  switchText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  switchTextBold: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  pickerButton: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    height: 48,
  },
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  dropdownIcon: {
    width: 20,
    alignItems: 'center',
  },
  dropdownArrow: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  pickerSelectedText: {
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    flex: 1,
  },
  pickerPlaceholderText: {
    color: theme.colors.textSecondary,
    ...theme.typography.body,
    flex: 1,
  },
  dropdownListContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 5,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 2,
    maxHeight: 180,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  selectedOptionItem: {
    backgroundColor: theme.colors.primary + '15',  // Using opacity hex
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  profilePhotoContainer: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadPlaceholderText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  uploadingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    marginTop: 4,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '22',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedChipText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
  },
  chipRemoveButton: {
    padding: 2,
  },
  chipRemoveText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
