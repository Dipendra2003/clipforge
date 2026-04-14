function PerformanceComparison({ topClips }) {
  if (!topClips || topClips.length === 0) {
    return null;
  }

  // Calculate averages
  const totalViews = topClips.reduce((sum, clip) => sum + clip.views, 0);
  const totalLikes = topClips.reduce((sum, clip) => sum + clip.likes, 0);
  const totalComments = topClips.reduce((sum, clip) => sum + clip.comments, 0);
  const avgViews = Math.round(totalViews / topClips.length);
  const avgLikes = Math.round(totalLikes / topClips.length);
  const avgComments = Math.round(totalComments / topClips.length);

  // Find best and worst performers
  const bestClip = topClips[0];
  const worstClip = topClips[topClips.length - 1];

  // Calculate performance difference
  const viewsDifference = bestClip.views - worstClip.views;
  const viewsPercentDiff = worstClip.views > 0 
    ? ((viewsDifference / worstClip.views) * 100).toFixed(0)
    : 100;

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Performance Comparison</h2>
      
      {/* Average Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium mb-1">Average Views</p>
          <p className="text-2xl font-bold text-purple-900">{avgViews.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Average Likes</p>
          <p className="text-2xl font-bold text-green-900">{avgLikes.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Average Comments</p>
          <p className="text-2xl font-bold text-blue-900">{avgComments.toLocaleString()}</p>
        </div>
      </div>

      {/* Best vs Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Performer */}
        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">🏆</span>
            <h3 className="font-semibold text-green-900">Best Performer</h3>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-2 truncate">{bestClip.title}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Views:</span>
              <span className="font-semibold text-green-700">{bestClip.views.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Likes:</span>
              <span className="font-semibold text-green-700">{bestClip.likes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Engagement:</span>
              <span className="font-semibold text-green-700">{bestClip.engagementRate}%</span>
            </div>
          </div>
        </div>

        {/* Worst Performer */}
        <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">📉</span>
            <h3 className="font-semibold text-orange-900">Needs Improvement</h3>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-2 truncate">{worstClip.title}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Views:</span>
              <span className="font-semibold text-orange-700">{worstClip.views.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Likes:</span>
              <span className="font-semibold text-orange-700">{worstClip.likes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Engagement:</span>
              <span className="font-semibold text-orange-700">{worstClip.engagementRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Gap */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Performance Gap:</span> Your best clip has{' '}
          <span className="font-bold text-purple-600">{viewsPercentDiff}% more views</span> than your lowest performer.
          {viewsPercentDiff > 200 && ' Consider analyzing what makes your top content successful.'}
        </p>
      </div>
    </div>
  );
}

export default PerformanceComparison;
