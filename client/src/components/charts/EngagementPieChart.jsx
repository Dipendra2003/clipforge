import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

// Custom tooltip component (defined outside render)
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
        <p className="text-sm text-gray-600">
          Count: <span className="font-semibold">{data.value.toLocaleString()}</span>
        </p>
        <p className="text-sm text-gray-600">
          Percentage: <span className="font-semibold">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend component (defined outside render)
const CustomLegend = ({ payload, data }) => {
  return (
    <div className="flex justify-center space-x-6 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm text-gray-700">
            {entry.value}: <span className="font-semibold">{data[index].value.toLocaleString()}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

function EngagementPieChart({ analyticsData, loading }) {
  // Prepare data for pie chart using useMemo to avoid recalculation
  // Must be called before any early returns (Rules of Hooks)
  const chartData = useMemo(() => {
    if (!analyticsData) return [];
    
    const data = [
      { 
        name: 'Likes', 
        value: analyticsData.totalLikes || 0,
        percentage: 0,
        fill: '#10b981'
      },
      { 
        name: 'Comments', 
        value: analyticsData.totalComments || 0,
        percentage: 0,
        fill: '#f59e0b'
      }
    ].filter(item => item.value > 0); // Only show non-zero values

    // Calculate percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);
    data.forEach(item => {
      item.percentage = ((item.value / total) * 100).toFixed(1);
    });

    return data;
  }, [analyticsData]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analyticsData || (analyticsData.totalLikes === 0 && analyticsData.totalComments === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">📊</p>
          <p>No engagement data available</p>
          <p className="text-sm mt-1">Publish clips and sync analytics to see breakdown</p>
        </div>
      </div>
    );
  }

  // Custom label
  const renderLabel = (entry) => {
    return `${entry.percentage}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
          dataKey="value"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={(props) => <CustomLegend {...props} data={chartData} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default EngagementPieChart;
