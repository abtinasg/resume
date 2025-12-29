'use client';

import { useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'email-notifications',
      label: 'Email Notifications',
      description: 'Receive email updates about your job search',
      enabled: true,
    },
    {
      id: 'weekly-summary',
      label: 'Weekly Summary',
      description: 'Get a weekly email with your progress and insights',
      enabled: true,
    },
    {
      id: 'job-match-alerts',
      label: 'Job Match Alerts',
      description: 'Get notified when we find relevant jobs',
      enabled: true,
    },
    {
      id: 'application-reminders',
      label: 'Application Reminders',
      description: 'Reminders to follow up on applications',
      enabled: false,
    },
  ]);
  const [saving, setSaving] = useState(false);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Mock API call - will be replaced with actual API integration
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800">Notifications</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage how you receive updates and alerts
        </p>
      </div>

      <div className="p-6 space-y-6">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex-1">
              <label
                htmlFor={setting.id}
                className="font-medium text-gray-800 cursor-pointer"
              >
                {setting.label}
              </label>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>
            <button
              id={setting.id}
              type="button"
              role="switch"
              aria-checked={setting.enabled}
              onClick={() => toggleSetting(setting.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle {setting.label}</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  setting.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
}
