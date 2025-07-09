import { useEffect, useState } from 'react';
import { getItem, setItem } from '@/utils/storage';

export interface PartnerProfile {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  workingHours?: {
    openTime: string;
    closeTime: string;
  };
  notifications?: {
    newOrders: boolean;
    payments: boolean;
    messages: boolean;
  };
  [key: string]: any; // allow extra fields
}

const PARTNER_PROFILE_KEY = 'partner_profile';

export function usePartnerProfile() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getItem(PARTNER_PROFILE_KEY);
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  // Save profile to storage
  const saveProfile = async (data: PartnerProfile) => {
    await setItem(PARTNER_PROFILE_KEY, data);
    setProfile(data);
  };

  return { profile, loading, saveProfile };
}

// Helper to get profile outside React (async)
export async function getStoredPartnerProfile(): Promise<PartnerProfile | null> {
  return await getItem(PARTNER_PROFILE_KEY);
}
