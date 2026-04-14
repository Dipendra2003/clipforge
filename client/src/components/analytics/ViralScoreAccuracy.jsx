import { useState, useEffect } from 'react';

function ViralScoreAccuracy() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchViralScoreAccuracy();
  }, []);

  const fetchViralScoreAccuracy = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/viral-score-accuracy`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Viral score accuracy error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Viral Score Accuracy</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.accuracy) {
    return null;
  }

  const accuracy = parseFloat(data.accuracy);
  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'text-green-600 bg-green-100';
    if (acc >= 60) return 'text-blue-600 bg-blue-100';
    if (acc >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Viral Score Prediction Accuracy</h2>
      
      {/* Overall Accuracy */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Prediction Accuracy</p>
            <p className={`text-4xl font-bold ${getAccuracyColor(accuracy).split(' ')[0]}`}>
              {accuracy}%
            </p>
            <p className="text-sm text-gray-600 mt-2">{data.interpretation}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Clips Analyzed</p>
            <p className="text-3xl font-bold text-gray-900">{data.totalClips}</p>
          </div>
        </div>
      </div>

      {/* Top Predictions */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Prediction vs Reality</h3>
        <div className="space-y-3">
          {data.clips.slice(0, 5).map((clip, index) => {
            const clipAccuracy = parseFloat(clip.accuracy);
            return (
              <div key={clip.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{clip.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {clip.views.toLocaleString()} views • {clip.engagementRate}% engagement
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getAccuracyColor(clipAccuracy)}`}>
                    {clipAccuracy}% accurate
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-600">Predicted Score</p>
                    <p className="text-lg font-bold text-purple-600">{clip.predictedScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Actual Score</p>
                    <p className="text-lg font-bold text-blue-600">{clip.actualScore}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">How it works:</span> We compare the AI-predicted viral score 
          (0-100) with actual performance based on views and engagement. Higher accuracy means better predictions.
        </p>
      </div>
    </div>
  );
}

export default ViralScoreAccuracy;
