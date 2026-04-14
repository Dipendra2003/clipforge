import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

// Custom tooltip component (defined outside render)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatNumber = (num) => {
      return num.toLocaleString();
    };

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{formatDate(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{formatNumber(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function EngagementAreaChart({ data, loading }) {
  // Calculate cumulative engagement for each day using useMemo
  // Must be called before any early returns (Rules of Hooks)
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(item => ({
      ...item,
      totalEngagement: item.likes + item.comments + item.shares
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">📊</p>
          <p>No engagement data available</p>
          <p className="text-sm mt-1">Publish clips and sync analytics to see trends</p>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format number for tooltip
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
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
        <Area 
          type="monotone" 
          dataKey="likes" 
          stroke="#10b981" 
          fillOpacity={1}
          fill="url(#colorLikes)"
          name="Likes"
          stackId="1"
        />
        <Area 
          type="monotone" 
          dataKey="comments" 
          stroke="#f59e0b" 
          fillOpacity={1}
          fill="url(#colorComments)"
          name="Comments"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default EngagementAreaChart;
