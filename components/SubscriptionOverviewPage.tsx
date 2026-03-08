import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlatformOwnerControlCenter from './platform/PlatformOwnerControlCenter';

const OWNER_EMAIL = 'dralafandy@gmail.com';

const SubscriptionOverviewPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const isPlatformOwner = String(userProfile?.email || user?.email || '').trim().toLowerCase() === OWNER_EMAIL;

  if (!isPlatformOwner) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-900/20">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
          Access denied: platform owner only.
        </p>
      </div>
    );
  }

  return <PlatformOwnerControlCenter />;
};

export default SubscriptionOverviewPage;
