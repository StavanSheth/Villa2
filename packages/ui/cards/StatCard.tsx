import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@villa-platform/design-system';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * StatCard — Metric display card with Glass 2 material.
 * 
 * Uses semantic tokens — fully theme-independent.
 * Supports status variants with color-coded icons.
 */
export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const iconColors = {
    default: 'text-muted-foreground bg-muted',
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  };

  return (
    <div className={cn(
      'relative overflow-hidden glass-card p-6',
      'transition-all hover:-translate-y-1 hover:shadow-villa-lg group',
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-body font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
          
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2 text-body">
              {trend && (
                <span className={cn(
                  "font-medium flex items-center",
                  trend.isPositive ? "text-success" : "text-danger"
                )}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
            </div>
          )}
        </div>
        
        <div className={cn("p-3 rounded-xl transition-colors", iconColors[variant])}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Decorative gradient blob on hover */}
      <div className={cn(
        "absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-slow pointer-events-none",
        variant === 'primary' ? 'bg-primary' :
        variant === 'success' ? 'bg-success' :
        variant === 'warning' ? 'bg-warning' :
        variant === 'danger' ? 'bg-danger' :
        'bg-foreground'
      )} />
    </div>
  );
}
