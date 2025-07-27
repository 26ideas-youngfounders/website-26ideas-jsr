
import { AdminLayout } from '@/components/admin/AdminLayout';
import { YffApplicationsTable } from '@/components/admin/YffApplicationsTable';

/**
 * YFF Applications Admin Page with real-time data synchronization
 * Features comprehensive application management with live updates
 */
export const YffApplicationsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YFF Applications</h1>
            <p className="text-gray-600">
              Manage Young Founders Floor team registrations and applications
            </p>
          </div>
        </div>

        <YffApplicationsTable />
      </div>
    </AdminLayout>
  );
};
