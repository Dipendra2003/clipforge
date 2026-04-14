import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

function ViewsLineChart({ data, loading }) {
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
          <p>No data available yet</p>
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
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          iconType="line"
        />
        <Line 
          type="monotone" 
          dataKey="views" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Views"
        />
        <Line 
          type="monotone" 
          dataKey="likes" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
          name="Likes"
        />
        <Line 
          type="monotone" 
          dataKey="comments" 
          stroke="#f59e0b" 
          strokeWidth={2}
          dot={{ fill: '#f59e0b', r: 4 }}
          activeDot={{ r: 6 }}
          name="Comments"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ViewsLineChart;
