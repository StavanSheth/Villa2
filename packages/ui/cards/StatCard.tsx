import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

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

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const iconColors = {
    default: 'text-white/60 bg-white/5',
    primary: 'text-primary bg-primary/10',
    success: 'text-green-400 bg-green-500/10',
    warning: 'text-orange-400 bg-orange-500/10',
    danger: 'text-red-400 bg-red-500/10'
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
          
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {trend && (
                <span className={clsx(
                  "font-medium flex items-center",
                  trend.isPositive ? "text-green-400" : "text-red-400"
                )}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && <span className="text-white/40">{subtitle}</span>}
            </div>
          )}
        </div>
        
        <div className={clsx("p-3 rounded-xl transition-colors", iconColors[variant])}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Decorative gradient blob on hover */}
      <div className={clsx(
        "absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none",
        variant === 'primary' ? 'bg-primary' :
        variant === 'success' ? 'bg-green-500' :
        variant === 'warning' ? 'bg-orange-500' :
        variant === 'danger' ? 'bg-red-500' :
        'bg-white'
      )} />
    </div>
  );
}
