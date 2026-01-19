export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'enroute'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface PassengerProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  passengerId: string;
  driverId?: string;
  pickupTime: string;
  arrivalTargetTime?: string;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedValue: number;
  finalValue?: number;
  status: BookingStatus;

  driverName?: string;
  driverPhone?: string;
  vehicle?: string;
  plate?: string;

  waitingTime?: number;
  waitingValue?: number;

  startedAt?: string;
  completedAt?: string;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FavoriteLabel = 'Casa' | 'Trabalho' | 'Academia' | 'Outro';

export interface FavoriteAddress {
  id: string;
  passengerId: string;
  label: FavoriteLabel;
  address: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  sender: 'driver' | 'passenger';
  message: string;
  timestamp: string;
  read: boolean;
}

export type PaymentType = 'pix' | 'card' | 'wallet';

export interface PaymentMethod {
  id: string;
  passengerId: string;
  type: PaymentType;
  last4?: string;
  brand?: string;
  isDefault: boolean;
  createdAt?: string;
}

// Form schemas
export interface ScheduleFormData {
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: Date;
  arrivalTargetTime?: Date;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
