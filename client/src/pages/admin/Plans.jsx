import { useState } from 'react';

function Plans() {
  const [plans] = useState([
    {
      id: 1,
      name: 'Free',
      price: 0,
      videosPerMonth: 5,
      storage: 1,
      features: ['Basic analytics', 'Watermark on clips'],
      active: true,
    },
    {
      id: 2,
      name: 'Pro',
      price: 29,
      videosPerMonth: 50,
      storage: 10,
      features: ['Advanced analytics', 'No watermark', 'Priority support'],
      active: true,
    },
    {
      id: 3,
      name: 'Business',
      price: 99,
      videosPerMonth: -1,
      storage: 100,
      features: ['Team collaboration', 'API access', 'Dedicated support'],
      active: true,
    },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {plan.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p className="text-4xl font-bold text-gray-900 mb-6">
              ${plan.price}
              <span className="text-lg text-gray-500">/month</span>
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Videos/month</span>
                <span className="font-semibold">{plan.videosPerMonth === -1 ? 'Unlimited' : plan.videosPerMonth}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Storage</span>
                <span className="font-semibold">{plan.storage} GB</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex space-x-2">
              <button className="flex-1 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition">
                Edit
              </button>
              <button className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Plans;
