function Subscription() {
  const currentPlan = {
    name: 'Free',
    videosPerMonth: 5,
    videosUsed: 0,
    storage: '1 GB',
    storageUsed: '0 MB',
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['5 videos/month', '1 GB storage', 'Basic analytics', 'Watermark on clips'],
    },
    {
      name: 'Pro',
      price: '$29',
      features: ['50 videos/month', '10 GB storage', 'Advanced analytics', 'No watermark', 'Priority support'],
      popular: true,
    },
    {
      name: 'Business',
      price: '$99',
      features: ['Unlimited videos', '100 GB storage', 'Team collaboration', 'API access', 'Dedicated support'],
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Subscription</h1>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 mb-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Current Plan: {currentPlan.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-purple-100 mb-2">Videos this month</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2" 
                  style={{ width: `${(currentPlan.videosUsed / currentPlan.videosPerMonth) * 100}%` }}
                />
              </div>
              <span className="font-semibold">{currentPlan.videosUsed}/{currentPlan.videosPerMonth}</span>
            </div>
          </div>
          <div>
            <p className="text-purple-100 mb-2">Storage</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2">
                <div className="bg-white rounded-full h-2" style={{ width: '0%' }} />
              </div>
              <span className="font-semibold">{currentPlan.storageUsed}/{currentPlan.storage}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-xl shadow p-6 ${
              plan.popular ? 'ring-2 ring-purple-600' : ''
            }`}
          >
            {plan.popular && (
              <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full mb-4">
                Most Popular
              </span>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-4xl font-bold text-gray-900 mb-6">
              {plan.price}
              <span className="text-lg text-gray-500">/month</span>
            </p>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-lg font-semibold transition ${
                plan.popular
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {plan.name === currentPlan.name ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
        <p className="text-gray-500 text-center py-8">No billing history yet</p>
      </div>
    </div>
  );
}

export default Subscription;
