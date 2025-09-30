// pages/Dashboard.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQR } from '../context/QRContext';
import StatsOverview from '../components/dashboard/StatsOverview';
import WarrantyAlerts from '../components/dashboard/WarrantyAlerts';
import RecentActivity from '../components/dashboard/RecentActivity';

const Dashboard = () => {
  const { user } = useAuth();
  const { qrCodes } = useQR();

  const VendorDashboard = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>
      <StatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent QR Generations</h2>
          <div className="space-y-2">
            {qrCodes.filter(qr => qr.vendor.includes('Vendor')).slice(0, 5).map(qr => (
              <div key={qr.id} className="flex justify-between items-center p-2 border-b">
                <span>{qr.lotNumber}</span>
                <span className="text-sm text-gray-600">{qr.itemType}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Supply Performance</h2>
          <div className="text-center py-8 text-gray-500">
            Performance metrics will be displayed here
          </div>
        </div>
      </div>
    </div>
  );

  const DepotDashboard = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Depot Management Dashboard</h1>
      <StatsOverview />
      <WarrantyAlerts />
    </div>
  );

  const EngineerDashboard = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Track Engineering Dashboard</h1>
      <StatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentActivity />
        <WarrantyAlerts />
      </div>
    </div>
  );

  const AdminDashboard = () => (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <StatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <WarrantyAlerts />
        <RecentActivity />
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">AI Analytics</h2>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-sm">Predicted failures in next 30 days: <strong>12 items</strong></p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-400">
              <p className="text-sm">Vendor A performance: <strong>98%</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getDashboard = () => {
    switch (user?.role) {
      case 'vendor':
        return <VendorDashboard />;
      case 'depot_staff':
        return <DepotDashboard />;
      case 'engineer':
        return <EngineerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <StatsOverview />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {getDashboard()}
    </div>
  );
};

export default Dashboard;