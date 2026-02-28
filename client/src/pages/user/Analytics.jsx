function Analytics() {
  const metrics = [
    { label: 'Total Views', value: '0', change: '+0%', icon: '👁️' },
    { label: 'Total Likes', value: '0', change: '+0%', icon: '❤️' },
    { label: 'Total Shares', value: '0', change: '+0%', icon: '🔄' },
    { label: 'Engagement Rate', value: '0%', change: '+0%', icon: '📊' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className="text-sm text-green-600 font-medium">{metric.change}</span>
            </div>
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Platform</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be displayed here
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Clips</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be displayed here
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
