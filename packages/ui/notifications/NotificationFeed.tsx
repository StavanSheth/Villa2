import React from 'react';
import { Bell, FileText, CreditCard, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export type NotificationType = 'booking' | 'payment' | 'invoice' | 'system' | 'success';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationFeedProps {
  notifications: NotificationItem[];
  title?: string;
  onMarkAllRead?: () => void;
}

const icons: Record<NotificationType, React.ReactNode> = {
  booking: <CalendarCheck size={18} className="text-blue-400" />,
  payment: <CreditCard size={18} className="text-orange-400" />,
  invoice: <FileText size={18} className="text-purple-400" />,
  system: <Bell size={18} className="text-gray-400" />,
  success: <CheckCircle2 size={18} className="text-green-400" />
};

export function NotificationFeed({ notifications, title = "Recent Notifications", onMarkAllRead }: NotificationFeedProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full backdrop-blur-md">
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell size={18} className="text-white/60" />
          {title}
        </h3>
        {onMarkAllRead && (
          <button 
            onClick={onMarkAllRead}
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto flex-1 p-2">
        {notifications.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-white/40">
            <Bell size={32} className="mb-2 opacity-20" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={clsx(
                  "p-3 rounded-xl flex gap-4 transition-colors group cursor-pointer",
                  notification.read ? "hover:bg-white/5" : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="mt-1 flex-shrink-0">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-black/40 border border-white/5"
                  )}>
                    {icons[notification.type]}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={clsx(
                      "text-sm truncate pr-4 font-medium",
                      notification.read ? "text-white/80" : "text-white"
                    )}>
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-white/40 whitespace-nowrap mt-0.5">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p className={clsx(
                    "text-xs line-clamp-2",
                    notification.read ? "text-white/50" : "text-white/70"
                  )}>
                    {notification.message}
                  </p>
                </div>
                
                {!notification.read && (
                  <div className="flex-shrink-0 mt-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
