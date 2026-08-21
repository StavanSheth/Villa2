import { QueryClient } from '@tanstack/react-query';

// Universal QueryClient configured for Next.js applications
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time
      staleTime: 1000 * 60 * 5,
      // Refetch on window focus based on production mode
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      retry: 2,
    },
  },
});
