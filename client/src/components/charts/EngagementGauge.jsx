import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';

function EngagementGauge({ engagementRate, loading }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const rate = parseFloat(engagementRate) || 0;

  // Determine color based on engagement rate
  let color = '#ef4444'; // red for low
  let label = 'Low';
  
  if (rate >= 10) {
    color = '#10b981'; // green for excellent
    label = 'Excellent';
  } else if (rate >= 7) {
    color = '#3b82f6'; // blue for great
    label = 'Great';
  } else if (rate >= 5) {
    color = '#f59e0b'; // orange for good
    label = 'Good';
  } else if (rate >= 3) {
    color = '#f97316'; // orange for fair
    label = 'Fair';
  }

  const data = [
    {
      name: 'Engagement',
      value: Math.min(rate, 100), // Cap at 100%
      fill: color
    }
  ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="60%" 
          outerRadius="90%" 
          barSize={20} 
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center" style={{ marginTop: '20px' }}>
          <p className="text-4xl font-bold" style={{ color }}>
            {rate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 mt-1">Engagement Rate</p>
          <p className="text-xs font-semibold mt-1" style={{ color }}>
            {label}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-xs text-center">
        <div>
          <div className="w-full h-2 bg-red-500 rounded mb-1"></div>
          <span className="text-gray-600">0-3%</span>
        </div>
        <div>
          <div className="w-full h-2 bg-orange-500 rounded mb-1"></div>
          <span className="text-gray-600">3-5%</span>
        </div>
        <div>
          <div className="w-full h-2 bg-amber-500 rounded mb-1"></div>
          <span className="text-gray-600">5-7%</span>
        </div>
        <div>
          <div className="w-full h-2 bg-blue-500 rounded mb-1"></div>
          <span className="text-gray-600">7-10%</span>
        </div>
        <div>
          <div className="w-full h-2 bg-green-500 rounded mb-1"></div>
          <span className="text-gray-600">10%+</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          {rate >= 10 && "🎉 Outstanding! Your content is highly engaging."}
          {rate >= 7 && rate < 10 && "✨ Great job! Your audience is very engaged."}
          {rate >= 5 && rate < 7 && "👍 Good engagement. Keep creating quality content."}
          {rate >= 3 && rate < 5 && "📈 Fair engagement. Try improving your content strategy."}
          {rate < 3 && "💡 Focus on creating more engaging content to boost interaction."}
        </p>
      </div>
    </div>
  );
}

export default EngagementGauge;
