import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PostModal({ clip, onClose, onSuccess, initialPlatform = 'youtube' }) {
  const [title, setTitle] = useState(clip.title || '');
  const [caption, setCaption] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);

  // Fetch connected platforms on mount
  useEffect(() => {
    const fetchConnectedPlatforms = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/api/platform/connections`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.connections) {
          const connected = response.data.connections
            .filter(conn => !conn.isExpired)
            .map(conn => conn.platform);
          setConnectedPlatforms(connected);
          
          // If initial platform not connected, switch to first available
          if (!connected.includes(initialPlatform) && connected.length > 0) {
            setSelectedPlatform(connected[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch connected platforms:', error);
      }
    };
    
    fetchConnectedPlatforms();
  }, [initialPlatform]);

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/ai/generate-caption`,
        { clipId: clip.id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCaption(response.data.caption);
        toast.success('Caption generated with AI!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to generate caption';
      toast.error(errorMessage);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handlePost = async () => {
    // Validate based on platform
    if (selectedPlatform === 'youtube' && !title.trim()) {
      toast.error('Title is required for YouTube');
      return;
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select a date and time for scheduling');
      return;
    }

    // Instagram doesn't support scheduling yet
    if (selectedPlatform === 'instagram' && isScheduled) {
      toast.error('Instagram scheduling is not supported yet');
      return;
    }

    setPosting(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Prepare request body based on platform
      const requestBody = {
        clipId: clip.id,
        caption: caption.trim()
      };

      // Add platform-specific fields
      if (selectedPlatform === 'youtube') {
        requestBody.title = title.trim();
        requestBody.privacy = 'public';
        
        // Add scheduling if enabled
        if (isScheduled) {
          requestBody.scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
          requestBody.timezone = 'Asia/Kolkata'; // IST
        }
      }

      // Post to selected platform
      const endpoint = selectedPlatform === 'youtube' 
        ? `${API_URL}/api/post/youtube`
        : `${API_URL}/api/post/instagram`;

      const response = await axios.post(
        endpoint,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        const platformName = selectedPlatform === 'youtube' ? 'YouTube' : 'Instagram';
        
        if (response.data.scheduled) {
          const scheduledTime = new Date(response.data.scheduledFor).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          toast.success(`Scheduled for ${scheduledTime} IST`);
        } else {
          toast.success(`Posted to ${platformName} successfully!`);
        }
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      const platformName = selectedPlatform === 'youtube' ? 'YouTube' : 'Instagram';
      const errorMessage = error.response?.data?.message || error.response?.data?.error || `Failed to post to ${platformName}`;
      toast.error(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Post to Social Media</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Platform Selector */}
        {connectedPlatforms.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platform
            </label>
            <div className="flex gap-2">
              {connectedPlatforms.includes('youtube') && (
                <button
                  onClick={() => setSelectedPlatform('youtube')}
                  disabled={posting}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition font-medium ${
                    selectedPlatform === 'youtube'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">▶️</span>
                  YouTube
                </button>
              )}
              {connectedPlatforms.includes('instagram') && (
                <button
                  onClick={() => setSelectedPlatform('instagram')}
                  disabled={posting}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition font-medium ${
                    selectedPlatform === 'instagram'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">📷</span>
                  Instagram
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Clip Preview Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎬</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{clip.title}</p>
              <div className="flex gap-3 text-xs text-gray-600 mt-1">
                <span>⏱️ {clip.duration}s</span>
                {clip.emotion && <span>😊 {clip.emotion}</span>}
                {clip.viral_score && <span>🔥 {Number(clip.viral_score).toFixed(0)}%</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Title Input - YouTube only */}
        {selectedPlatform === 'youtube' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              placeholder="Enter video title"
              maxLength={100}
              disabled={posting}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>
        )}

        {/* Caption Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Caption
            </label>
            <button
              onClick={handleGenerateCaption}
              disabled={generatingCaption || posting}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingCaption ? (
                <>
                  <span className="inline-block animate-spin mr-1">⏳</span>
                  Generating...
                </>
              ) : (
                <>🤖 Generate with AI</>
              )}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none resize-none"
            placeholder="Write a caption or generate one with AI..."
            rows={6}
            maxLength={5000}
            disabled={posting}
          />
          <p className="text-xs text-gray-500 mt-1">{caption.length}/5000 characters</p>
          <p className="text-xs text-gray-400 mt-1">
            💡 Tip: AI-generated captions are optimized for YouTube Shorts. You can edit them before posting.
          </p>
        </div>

        {/* Schedule Toggle - YouTube only */}
        {selectedPlatform === 'youtube' && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="schedule-toggle"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              disabled={posting}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="schedule-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
              📅 Schedule for later
            </label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={posting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={posting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          )}
          
          {isScheduled && (
            <p className="text-xs text-purple-600 mt-2">
              ⚡ Quick scheduling! Video upload happens in background. You'll be notified when ready.
            </p>
          )}
        </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={posting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting || (selectedPlatform === 'youtube' && !title.trim()) || (isScheduled && (!scheduledDate || !scheduledTime))}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                {isScheduled ? 'Scheduling...' : 'Posting...'}
              </>
            ) : (
              <>
                {isScheduled ? '📅 Schedule Post' : (
                  selectedPlatform === 'youtube' ? '▶️ Post to YouTube' : '📷 Post to Instagram'
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostModal;
