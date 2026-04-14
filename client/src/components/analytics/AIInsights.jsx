import { useState, useEffect } from 'react';

function AIInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/ai-insights`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      } else {
        throw new Error('Failed to fetch AI insights');
      }
    } catch (err) {
      console.error('AI insights error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 AI-Powered Insights</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing your performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 mb-8 border-2 border-purple-200">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-3xl">🤖</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
          <p className="text-sm text-gray-600">Powered by Gemini AI</p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">📊 Performance Summary</h3>
        <p className="text-gray-700">{insights.performanceSummary}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Strengths */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center">
            <span className="mr-2">✅</span>
            What's Working
          </h3>
          <ul className="space-y-2">
            {insights.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-green-800 flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Areas to Improve
          </h3>
          <ul className="space-y-2">
            {insights.improvements.map((improvement, index) => (
              <li key={index} className="text-sm text-orange-800 flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Recommendations */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Content Recommendations
        </h3>
        <ul className="space-y-2">
          {insights.contentRecommendations.map((recommendation, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <span className="text-purple-600 font-bold mr-2">{index + 1}.</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Posting Strategy */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">📅</span>
          Best Posting Strategy
        </h3>
        <p className="text-sm text-blue-800">{insights.bestPostingStrategy}</p>
      </div>

      {/* Viral Potential */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
          <span className="mr-2">🚀</span>
          Viral Potential Assessment
        </h3>
        <p className="text-sm text-purple-800">{insights.viralPotential}</p>
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={fetchAIInsights}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          🔄 Refresh Insights
        </button>
      </div>
    </div>
  );
}

export default AIInsights;
