import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom tooltip component (defined outside render)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function PlatformBarChart({ platformData, loading }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!platformData) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">📊</p>
          <p>No platform data available</p>
        </div>
      </div>
    );
  }

  // Transform platform data for chart
  const chartData = [
    {
      platform: 'YouTube',
      views: platformData.youtube?.totalViews || 0,
      likes: platformData.youtube?.totalLikes || 0,
      comments: platformData.youtube?.totalComments || 0,
      posts: platformData.youtube?.postsCount || 0
    },
    {
      platform: 'Instagram',
      views: platformData.instagram?.totalViews || 0,
      likes: platformData.instagram?.totalLikes || 0,
      comments: platformData.instagram?.totalComments || 0,
      posts: platformData.instagram?.postsCount || 0
    }
  ];

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="platform" 
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9ca3af"
          style={{ fontSize: '12px' }}
          tickFormatter={formatNumber}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '14px' }}
        />
        <Bar 
          dataKey="views" 
          fill="#8b5cf6" 
          name="Views"
          radius={[8, 8, 0, 0]}
        />
        <Bar 
          dataKey="likes" 
          fill="#10b981" 
          name="Likes"
          radius={[8, 8, 0, 0]}
        />
        <Bar 
          dataKey="comments" 
          fill="#f59e0b" 
          name="Comments"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default PlatformBarChart;
