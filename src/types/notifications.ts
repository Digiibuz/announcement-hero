
export type NotificationType = 'reminder' | 'alert' | 'info';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  metadata?: any;
}

export interface NotificationPreferences {
  reminder_enabled: boolean;
  alert_enabled: boolean;
  info_enabled: boolean;
}
