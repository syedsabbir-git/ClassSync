// src/components/dashboard/Analytics/AnalyticsPage.jsx
import React from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import StatCard from '../Shared/StatCard';
import EmptyState from '../Shared/EmptyState';

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track performance and engagement metrics
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl p-12 border border-gray-200">
        <EmptyState
          icon={BarChart3}
          title="Analytics Coming Soon"
          description="Detailed analytics and insights will be available in the next update"
          actionButton={
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Request Early Access
            </button>
          }
        />
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Student Engagement"
          value="85%"
          icon={TrendingUp}
          color="green"
          subtitle="Average completion rate"
        />
        <StatCard
          title="Active Students"
          value="24"
          icon={Users}
          color="blue"
          subtitle="This week"
        />
        <StatCard
          title="Avg. Response Time"
          value="2.3h"
          icon={Clock}
          color="purple"
          subtitle="To activities"
        />
        <StatCard
          title="Performance Score"
          value="4.2/5"
          icon={BarChart3}
          color="orange"
          subtitle="Overall rating"
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;
