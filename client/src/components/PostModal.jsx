import { useState } from 'react';
import axios from 'axios';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PostModal({ clip, onClose, onSuccess }) {
  const [title, setTitle] = useState(clip.title || '');
  const [caption, setCaption] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

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
      console.error('Caption generation error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to generate caption';
      toast.error(errorMessage);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select a date and time for scheduling');
      return;
    }

    setPosting(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Prepare request body
      const requestBody = {
        clipId: clip.id,
        title: title.trim(),
        caption: caption.trim(),
        privacy: 'public'
      };

      // Add scheduling if enabled
      if (isScheduled) {
        // Combine date and time into UTC timestamp
        const localDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        requestBody.scheduledFor = localDateTime.toISOString();
      }

      const response = await axios.post(
        `${API_URL}/api/post/youtube`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (response.data.scheduled) {
          toast.success(`Scheduled for ${new Date(response.data.scheduledFor).toLocaleString()}`);
        } else {
          toast.success('Posted to YouTube Shorts!');
        }
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Post error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to post to YouTube';
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
          <h2 className="text-2xl font-bold text-gray-900">Post to YouTube</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Clip Preview Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎬</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{clip.title}</p>
              <div className="flex gap-3 text-xs text-gray-600 mt-1">
                <span>⏱️ {clip.duration}s</span>
                {clip.emotion && <span>😊 {clip.emotion}</span>}
                {clip.viral_score && <span>🔥 {(clip.viral_score * 100).toFixed(0)}%</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Title Input */}
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

        {/* Schedule Toggle */}
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
            disabled={posting || !title.trim() || (isScheduled && (!scheduledDate || !scheduledTime))}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                {isScheduled ? 'Scheduling...' : 'Posting...'}
              </>
            ) : (
              <>{isScheduled ? '📅 Schedule Post' : '▶️ Post to YouTube'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostModal;
