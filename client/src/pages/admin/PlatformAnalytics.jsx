function PlatformAnalytics() {
  const metrics = [
    { label: 'Total Views', value: '0', change: '+0%', icon: '👁️' },
    { label: 'Platform Usage', value: '0%', change: '+0%', icon: '📱' },
    { label: 'Processing Load', value: '0%', change: '+0%', icon: '⚙️' },
    { label: 'API Quota', value: '0%', change: '+0%', icon: '🔌' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Platform Analytics</h1>

      {/* Metrics */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Views by Platform</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be displayed here
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Load Over Time</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart will be displayed here
          </div>
        </div>
      </div>

      {/* API Usage */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">API Quota Usage</h2>
        <div className="space-y-4">
          {['YouTube API', 'TikTok API', 'Instagram API'].map((api) => (
            <div key={api} className="flex items-center justify-between">
              <span className="text-gray-700">{api}</span>
              <div className="flex items-center space-x-3 flex-1 max-w-md ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 rounded-full h-2" style={{ width: '0%' }} />
                </div>
                <span className="text-sm text-gray-600">0%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlatformAnalytics;
