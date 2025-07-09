export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  apparelTypes: string | null;
  isAvailable: boolean;
  partnerId: string;
  createdAt: string;
  updatedAt: string;
}
