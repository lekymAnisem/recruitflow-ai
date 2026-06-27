import {
  Settings,
  CreditCard,
  Users,
  Bell,
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';

const comingSoonFeatures = [
  {
    icon: CreditCard,
    title: 'Subscription & Billing',
    description:
      'Manage your plan, view invoices, and update payment methods.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Invite team members, assign roles, and manage permissions.',
  },
  {
    icon: Shield,
    title: 'Security & SSO',
    description: 'Configure single sign-on, 2FA, and audit logs.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Customize email and in-app notification preferences.',
  },
  {
    icon: Zap,
    title: 'Integrations',
    description: 'Connect with ATS platforms, calendars, and HR tools.',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and organization preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {comingSoonFeatures.map((feature) => (
          <Card
            key={feature.title}
            className="relative overflow-hidden transition-shadow hover:shadow-md"
          >
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                Soon
              </span>
            </div>
            <CardBody className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {feature.description}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-gray-300 bg-gray-50">
        <CardBody className="flex flex-col items-center py-12 text-center">
          <Settings className="mb-3 h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            More settings coming soon
          </h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            We're actively building out the settings experience. Subscription
            management, team management, and billing features will be available
            in an upcoming release.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
