// utils/validation.ts

export const validateEmail = (email: string) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

export const validatePhone = (phone: string) => {
  return /^[0-9]\d{9}$/.test(phone);
};

export const restrictPhoneInput = (value: string) => {
  return value.replace(/[^0-9]/g, '').slice(0, 10);
};
