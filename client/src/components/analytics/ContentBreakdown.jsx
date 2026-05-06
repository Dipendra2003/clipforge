function ContentBreakdown({ topClips }) {
  if (!topClips || topClips.length === 0) {
    return null;
  }

  // Analyze by emotion
  const emotionAnalysis = {};
  topClips.forEach(clip => {
    if (!clip.emotion) return;
    
    if (!emotionAnalysis[clip.emotion]) {
      emotionAnalysis[clip.emotion] = {
        count: 0,
        totalViews: 0,
        totalLikes: 0,
        avgEngagement: 0
      };
    }
    
    emotionAnalysis[clip.emotion].count++;
    emotionAnalysis[clip.emotion].totalViews += clip.views;
    emotionAnalysis[clip.emotion].totalLikes += clip.likes;
    emotionAnalysis[clip.emotion].avgEngagement += parseFloat(clip.engagementRate);
  });

  // Calculate averages
  Object.keys(emotionAnalysis).forEach(emotion => {
    const data = emotionAnalysis[emotion];
    data.avgViews = Math.round(data.totalViews / data.count);
    data.avgLikes = Math.round(data.totalLikes / data.count);
    data.avgEngagement = (data.avgEngagement / data.count).toFixed(2);
  });

  // Sort by average views
  const sortedEmotions = Object.entries(emotionAnalysis)
    .sort(([, a], [, b]) => b.avgViews - a.avgViews)
    .slice(0, 5); // Top 5 emotions

  // Emotion icons
  const emotionIcons = {
    'excitement': '🎉',
    'joy': '😊',
    'surprise': '😲',
    'humor': '😄',
    'inspiration': '✨',
    'curiosity': '🤔',
    'suspense': '😮',
    'nostalgia': '🥺',
    'anger': '😠',
    'sadness': '😢',
    'fear': '😨',
    'neutral': '😐'
  };

  // Analyze by duration
  const durationRanges = {
    'Short (0-30s)': { min: 0, max: 30, count: 0, totalViews: 0 },
    'Medium (31-60s)': { min: 31, max: 60, count: 0, totalViews: 0 },
    'Long (60s+)': { min: 61, max: Infinity, count: 0, totalViews: 0 }
  };

  topClips.forEach(clip => {
    if (!clip.duration) return;
    
    Object.keys(durationRanges).forEach(range => {
      const { min, max } = durationRanges[range];
      if (clip.duration >= min && clip.duration <= max) {
        durationRanges[range].count++;
        durationRanges[range].totalViews += clip.views;
      }
    });
  });

  // Calculate average views per duration range
  Object.keys(durationRanges).forEach(range => {
    const data = durationRanges[range];
    data.avgViews = data.count > 0 ? Math.round(data.totalViews / data.count) : 0;
  });

  const bestDuration = Object.entries(durationRanges)
    .sort(([, a], [, b]) => b.avgViews - a.avgViews)[0];

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🎬 Content Performance Breakdown</h2>
      
      {/* Emotion Analysis */}
      {sortedEmotions.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Performance by Emotion</h3>
          <div className="space-y-2 sm:space-y-3">
            {sortedEmotions.map(([emotion, data], index) => (
              <div key={emotion} className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-base sm:text-lg">{emotionIcons[emotion.toLowerCase()] || '🎭'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize truncate">{emotion}</span>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{data.count} clips</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600">
                    <span className="whitespace-nowrap">👁️ {data.avgViews.toLocaleString()}</span>
                    <span className="whitespace-nowrap">❤️ {data.avgLikes.toLocaleString()}</span>
                    <span className="whitespace-nowrap">📊 {data.avgEngagement}%</span>
                  </div>
                </div>
                {index === 0 && (
                  <span className="px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex-shrink-0">
                    Best
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration Analysis */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Performance by Duration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(durationRanges).map(([range, data]) => {
            const isBest = range === bestDuration[0];
            return (
              <div 
                key={range}
                className={`p-3 sm:p-4 rounded-lg border-2 ${
                  isBest 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <p className={`text-xs sm:text-sm font-semibold ${isBest ? 'text-green-900' : 'text-gray-700'}`}>
                    {range}
                  </p>
                  {isBest && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-green-200 text-green-800 text-xs font-bold rounded">
                      ⭐ Best
                    </span>
                  )}
                </div>
                <p className={`text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 ${isBest ? 'text-green-900' : 'text-gray-900'}`}>
                  {data.avgViews.toLocaleString()}
                </p>
                <p className={`text-xs ${isBest ? 'text-green-600' : 'text-gray-500'}`}>
                  avg views ({data.count} clips)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <span className="text-xl sm:text-2xl">💡</span>
          <div>
            <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Content Strategy Tip</p>
            <p className="text-xs sm:text-sm text-gray-700">
              {sortedEmotions.length > 0 && (
                <>
                  Your <span className="font-semibold text-purple-600 capitalize">{sortedEmotions[0][0]}</span> content performs best.{' '}
                </>
              )}
              {bestDuration && bestDuration[1].count > 0 && (
                <>
                  Clips in the <span className="font-semibold text-purple-600">{bestDuration[0]}</span> range get the most views.{' '}
                </>
              )}
              Focus on creating more content in these categories for better performance!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentBreakdown;
