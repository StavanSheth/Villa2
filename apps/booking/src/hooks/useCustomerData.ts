import { useQuery } from '@tanstack/react-query';

// Mock API responses for TanStack Query
const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'success' as const,
    title: 'Booking Confirmed!',
    message: 'Your stay at Seven C Villa has been fully confirmed.',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: 'n2',
    type: 'payment' as const,
    title: 'Advance Payment Received',
    message: 'We received your advance payment of ₹15,000 via UPI.',
    timestamp: '1 day ago',
    read: true
  },
  {
    id: 'n3',
    type: 'system' as const,
    title: 'Welcome to Mavon',
    message: 'Complete your profile to unlock faster bookings and exclusive offers.',
    timestamp: '3 days ago',
    read: true
  }
];

const MOCK_RECOMMENDED_VILLAS = [
  {
    id: 'v1',
    name: "Chunawala's Seven C Villa",
    location: 'Lonavala, Maharashtra',
    imageUrl: 'http://localhost:3000/photos/day/Hero%20page.jpeg',
    rating: 5.0,
    reviewsCount: 124,
    guests: 15,
    pricePerNight: 15000,
    tags: ['wifi', 'pool', 'barbeque']
  }
];

export function useCustomerNotifications() {
  return useQuery({
    queryKey: ['customer', 'notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return MOCK_NOTIFICATIONS;
    }
  });
}

export function useRecommendedVillas() {
  return useQuery({
    queryKey: ['customer', 'recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/villas');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return MOCK_RECOMMENDED_VILLAS;
    }
  });
}
