function BestPostingTime({ topClips }) {
  if (!topClips || topClips.length === 0) {
    return null;
  }

  // Analyze posting times
  const postingTimeAnalysis = {};
  const dayAnalysis = {};

  topClips.forEach(clip => {
    if (!clip.publishedAt) return;

    const date = new Date(clip.publishedAt);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Group by hour
    if (!postingTimeAnalysis[hour]) {
      postingTimeAnalysis[hour] = { count: 0, totalViews: 0, totalEngagement: 0 };
    }
    postingTimeAnalysis[hour].count++;
    postingTimeAnalysis[hour].totalViews += clip.views;
    postingTimeAnalysis[hour].totalEngagement += parseFloat(clip.engagementRate);

    // Group by day
    if (!dayAnalysis[day]) {
      dayAnalysis[day] = { count: 0, totalViews: 0, totalEngagement: 0 };
    }
    dayAnalysis[day].count++;
    dayAnalysis[day].totalViews += clip.views;
    dayAnalysis[day].totalEngagement += parseFloat(clip.engagementRate);
  });

  // Calculate averages and find best times
  let bestHour = null;
  let bestHourAvgViews = 0;

  Object.keys(postingTimeAnalysis).forEach(hour => {
    const data = postingTimeAnalysis[hour];
    const avgViews = data.totalViews / data.count;
    if (avgViews > bestHourAvgViews) {
      bestHourAvgViews = avgViews;
      bestHour = parseInt(hour);
    }
  });

  let bestDay = null;
  let bestDayAvgViews = 0;

  Object.keys(dayAnalysis).forEach(day => {
    const data = dayAnalysis[day];
    const avgViews = data.totalViews / data.count;
    if (avgViews > bestDayAvgViews) {
      bestDayAvgViews = avgViews;
      bestDay = day;
    }
  });

  // Format hour for display
  const formatHour = (hour) => {
    if (hour === null) return 'N/A';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Get time of day category
  const getTimeCategory = (hour) => {
    if (hour >= 5 && hour < 12) return { label: 'Morning', icon: '🌅', color: 'yellow' };
    if (hour >= 12 && hour < 17) return { label: 'Afternoon', icon: '☀️', color: 'orange' };
    if (hour >= 17 && hour < 21) return { label: 'Evening', icon: '🌆', color: 'purple' };
    return { label: 'Night', icon: '🌙', color: 'blue' };
  };

  const timeCategory = bestHour !== null ? getTimeCategory(bestHour) : null;

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">⏰ Best Posting Time</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Best Hour */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">{timeCategory?.icon || '⏰'}</span>
            <div>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Best Time to Post</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-900">{formatHour(bestHour)}</p>
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-purple-700">Time of Day:</span>
              <span className="font-semibold text-purple-900">{timeCategory?.label || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-purple-700">Avg Views:</span>
              <span className="font-semibold text-purple-900">{Math.round(bestHourAvgViews).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2 sm:mt-3">
            Posts at this time get the most views on average
          </p>
        </div>

        {/* Best Day */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">📅</span>
            <div>
              <p className="text-xs sm:text-sm text-blue-600 font-medium">Best Day to Post</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{bestDay || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-blue-700">Posts on this day:</span>
              <span className="font-semibold text-blue-900">{dayAnalysis[bestDay]?.count || 0}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-blue-700">Avg Views:</span>
              <span className="font-semibold text-blue-900">{Math.round(bestDayAvgViews).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 sm:mt-3">
            Your audience is most active on this day
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <span className="text-xl sm:text-2xl">💡</span>
          <div>
            <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Recommendation</p>
            <p className="text-xs sm:text-sm text-gray-700">
              {bestDay && bestHour !== null ? (
                <>
                  For maximum reach, try posting on <span className="font-semibold text-purple-600">{bestDay}s</span> around{' '}
                  <span className="font-semibold text-purple-600">{formatHour(bestHour)}</span>. This is when your content performs best!
                </>
              ) : (
                'Post more clips to get personalized posting time recommendations based on your audience behavior.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-gray-500 mt-3 sm:mt-4 text-center">
        Based on analysis of your top {topClips.length} performing clips
      </p>
    </div>
  );
}

export default BestPostingTime;
