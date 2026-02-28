/**
 * Get Tailwind CSS classes for emotion badges
 */
export function getEmotionColor(emotion) {
  const colors = {
    joy: 'bg-yellow-100 text-yellow-800',
    excitement: 'bg-orange-100 text-orange-800',
    surprise: 'bg-pink-100 text-pink-800',
    inspiration: 'bg-blue-100 text-blue-800',
    humor: 'bg-green-100 text-green-800',
    general: 'bg-gray-100 text-gray-800'
  };
  return colors[emotion] || colors.general;
}

/**
 * Get Tailwind CSS classes for status badges
 */
export function getStatusBadge(status) {
  const badges = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return badges[status] || badges.pending;
}
