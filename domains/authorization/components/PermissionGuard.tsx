'use client';

import React, { useEffect, useState } from 'react';
// Assuming we have a hook to get the current authenticated user's role from context or store
import { useThemeStore } from '@villa-platform/hooks';

interface PermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  resource: string;
  action: string;
}

/**
 * Universal PermissionGuard
 * Wraps UI elements and only renders them if the current user has the correct permissions.
 * Eliminates the need for hardcoded role checks (e.g., if role === 'ADMIN').
 */
export function PermissionGuard({ children, fallback = null, resource, action }: PermissionGuardProps) {
  // In a real implementation, this would fetch from a useAuth hook or similar context
  // Here we use the roleTheme as a proxy for the user's role for scaffolding purposes
  const currentRole = useThemeStore((state) => state.roleTheme);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // Scaffolded permission check logic. 
    // In production, this would either query a cached Casbin policy locally
    // or rely on a pre-fetched permissions object from the API.
    const checkPermission = async () => {
      // Mocked rules matching the architecture design

      
      if (currentRole === 'STAFF') {
        const staffAllowed = [
          'Payment:collect', 
          'Booking:checkin', 
          'Booking:checkout', 
          'Invoice:generate'
        ];
        setIsAllowed(staffAllowed.includes(`${resource}:${action}`));
        return;
      }

      if (currentRole === 'CUSTOMER') {
        const customerAllowed = [
          'Booking:cancel', 
          'Booking:review', 
          'Invoice:download'
        ];
        setIsAllowed(customerAllowed.includes(`${resource}:${action}`));
        return;
      }

      setIsAllowed(false);
    };

    checkPermission();
  }, [currentRole, resource, action]);

  if (isAllowed === null) {
    // Optionally return a tiny skeleton or null while checking
    return null;
  }

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}
