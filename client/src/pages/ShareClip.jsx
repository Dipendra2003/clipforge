import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVideoUrl, formatDuration } from '../utils/videoUrl';
import { getEmotionColor } from '../utils/helpers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ShareClip() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const [clip, setClip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchClip();
  }, [clipId]);

  const fetchClip = async () => {
    try {
      const response = await fetch(`${API_URL}/api/clips/public/${clipId}`);
      
      if (!response.ok) {
        throw new Error('Clip not found');
      }

      const data = await response.json();
      setClip(data.clip);
    } catch (err) {
      console.error('Error fetching clip:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: clip.title,
          text: `Check out this viral clip: ${clip.title}`,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownload = async () => {
    try {
      const url = getVideoUrl(clip.clipUrl, clip.clipUrl);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download clip');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clip Not Found</h1>
          <p className="text-gray-600 mb-6">
            This clip doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">✂️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ClipForge AI</h1>
                <p className="text-xs text-gray-500">AI-Powered Viral Clips</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              Create Your Clips
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Video Player */}
          <div className="relative bg-black aspect-video">
            <video
              src={getVideoUrl(clip.clipUrl, clip.clipUrl)}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
            {clip.viral_score && (
              <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                🔥 {Number(clip.viral_score).toFixed(0)}% Viral Score
              </div>
            )}
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
              {formatDuration(clip.duration)}
            </div>
          </div>

          {/* Clip Info */}
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {clip.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {clip.emotion && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEmotionColor(clip.emotion)}`}>
                    {clip.emotion}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {clip.start_time}s - {clip.end_time}s
                </span>
                <span className="text-sm text-gray-500">
                  • {new Date(clip.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>

              {clip.videoTitle && (
                <p className="text-sm text-gray-600">
                  From: <span className="font-medium">{clip.videoTitle}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
              
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <span>📥</span>
                <span>Download</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <span>{copied ? '✓' : '🔗'}</span>
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Create Your Own Viral Clips
              </h3>
              <p className="text-gray-600 mb-4">
                Turn your long videos into viral shorts with AI in seconds
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold shadow-lg"
              >
                Get Started Free →
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 text-center shadow">
            <div className="text-3xl mb-2">🤖</div>
            <h4 className="font-semibold text-gray-900 mb-1">AI-Powered</h4>
            <p className="text-sm text-gray-600">
              Smart AI finds the most viral moments
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow">
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-1">Lightning Fast</h4>
            <p className="text-sm text-gray-600">
              Generate clips in seconds, not hours
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="font-semibold text-gray-900 mb-1">Viral Score</h4>
            <p className="text-sm text-gray-600">
              AI predicts viral potential of each clip
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          <p>© 2026 ClipForge AI. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-purple-600 transition">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-purple-600 transition">
              Terms
            </button>
            <span>•</span>
            <button onClick={() => navigate('/about')} className="hover:text-purple-600 transition">
              About
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ShareClip;
