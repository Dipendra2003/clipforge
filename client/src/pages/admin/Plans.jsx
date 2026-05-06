import { useState, useEffect } from 'react';
import axios from 'axios';

function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL;

      const response = await axios.get(`${baseUrl}/api/admin/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlans(response.data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = async (planId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL;

      await axios.patch(
        `${baseUrl}/api/admin/plans/${planId}/status`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh plans list
      fetchPlans();
    } catch (err) {
      console.error('Error updating plan status:', err);
      alert('Failed to update plan status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchPlans}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage subscription tiers and pricing
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500">No subscription plans found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                plan.is_active ? 'border-purple-200' : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-4xl font-bold text-gray-900 mb-2">
                ${plan.price}
                <span className="text-lg text-gray-500">/month</span>
              </p>

              {plan.description && (
                <p className="text-sm text-gray-600 mb-6">
                  {plan.description}
                </p>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Videos/month</span>
                  <span className="font-semibold">
                    {plan.videos_per_month === -1 ? 'Unlimited' : plan.videos_per_month}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-semibold">{plan.storage_gb} GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Clips per video</span>
                  <span className="font-semibold">
                    {plan.clips_per_video === -1 ? 'Unlimited' : plan.clips_per_video}
                  </span>
                </div>
                {plan.max_video_length && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max video length</span>
                    <span className="font-semibold">{plan.max_video_length} min</span>
                  </div>
                )}
              </div>

              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* User Count */}
              {plan.user_count !== undefined && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{plan.user_count}</span> users on this plan
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleTogglePlan(plan.id, plan.is_active)}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    plan.is_active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Plans;
