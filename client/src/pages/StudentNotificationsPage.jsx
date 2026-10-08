import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, Check, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { examService } from '../services/examService';
import { formatExamDateTime } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export const StudentNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await examService.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await examService.markNotificationsRead();
      await fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    if (type === 'EXAM_SUBMITTED') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (type === 'RESULT_PUBLISHED') return <Bell className="w-5 h-5 text-[var(--primary)]" />;
    return <AlertCircle className="w-5 h-5 text-amber-500" />;
  };

  return (
    <AppShell title="Student Notifications">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Stay updated on your exam and result statuses.</p>
          </div>
          {notifications.some(n => !n.read) && (
             <Button variant="outline" size="sm" icon={Check} onClick={markAllRead}>
               Mark all as read
             </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
            <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <Bell className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Notifications</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              You are all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
             {notifications.map(n => (
                <div key={n._id} className={`p-4 bg-[var(--surface)] rounded-xl border flex items-start gap-4 ${n.read ? 'border-[var(--border-subtle)] opacity-70' : 'border-[var(--primary-border)] shadow-sm'}`}>
                   <div className="mt-1 shrink-0">
                     {getIcon(n.type)}
                   </div>
                   <div className="flex-1">
                     <h4 className={`text-sm font-bold ${n.read ? 'text-[var(--text-primary)]' : 'text-[var(--primary)]'}`}>{n.title}</h4>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">{n.message}</p>
                     <span className="text-[10px] text-[var(--text-secondary)] mt-2 block">{formatExamDateTime(n.createdAt)}</span>
                   </div>
                   {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-2"></div>}
                </div>
             ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
