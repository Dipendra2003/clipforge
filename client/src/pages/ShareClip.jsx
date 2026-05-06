import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVideoUrl, formatDuration } from '../utils/videoUrl';
import { getEmotionColor } from '../utils/helpers';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ShareClip() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const [clip, setClip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    fetchClip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipId]);

  const fetchClip = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/clips/public/${clipId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Clip not found');
        } else if (response.status === 403) {
          throw new Error('This clip is private');
        } else {
          throw new Error('Failed to load clip');
        }
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
    toast.success('Link copied to clipboard!');
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
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleSocialShare = (platform) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(clip.title);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${shareUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      whatsapp: `https://wa.me/?text=${title}%20${shareUrl}`,
      telegram: `https://t.me/share/url?url=${shareUrl}&text=${title}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleDownload = async () => {
    try {
      toast.info('Downloading clip...');
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
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download clip');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading clip...</p>
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform hover:scale-105 transition-transform">
          <div className="text-6xl mb-4 animate-bounce">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clip Not Found</h1>
          <p className="text-gray-600 mb-6">
            This clip doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium shadow-lg"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform flex-shrink-0">
                <span className="text-white font-bold text-lg sm:text-xl">✂️</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                  ClipForge AI
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">AI-Powered Viral Clips</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition text-xs sm:text-sm font-medium shadow-lg transform hover:scale-105 whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">Create Your Clips</span>
              <span className="sm:hidden">Create Clips</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transform hover:shadow-3xl transition-shadow">
          {/* Video Player */}
          <div className="relative bg-black aspect-video group">
            <video
              src={getVideoUrl(clip.clipUrl, clip.clipUrl)}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Viral Score Badge */}
            {clip.viral_score && (
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg backdrop-blur-sm animate-pulse">
                🔥 {Number(clip.viral_score).toFixed(0)}%
              </div>
            )}
            
            {/* Duration Badge */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/75 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold">
              ⏱️ {formatDuration(clip.duration)}
            </div>
            
            {/* Play Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-l-[16px] sm:border-l-[20px] border-l-purple-600 border-t-[10px] sm:border-t-[12px] border-t-transparent border-b-[10px] sm:border-b-[12px] border-b-transparent ml-1"></div>
                </div>
              </div>
            )}
          </div>

          {/* Clip Info */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                {clip.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {clip.emotion && (
                  <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm ${getEmotionColor(clip.emotion)}`}>
                    <span>😊</span>
                    <span className="truncate max-w-[120px]">{clip.emotion}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  <span>⏰</span>
                  <span className="whitespace-nowrap">{clip.start_time}s - {clip.end_time}s</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  <span>📅</span>
                  <span className="whitespace-nowrap">
                    {new Date(clip.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </span>
              </div>

              {clip.videoTitle && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-semibold">From video:</span> <span className="break-words">{clip.videoTitle}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="relative">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium shadow-lg transform hover:scale-105 text-sm sm:text-base"
                >
                  <span>📤</span>
                  <span>Share</span>
                </button>
                
                {/* Share Menu */}
                {showShareMenu && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-10 animate-fadeIn">
                    <button
                      onClick={() => handleSocialShare('twitter')}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-blue-50 rounded-lg transition text-left"
                    >
                      <span className="text-lg sm:text-xl">🐦</span>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleSocialShare('facebook')}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-blue-50 rounded-lg transition text-left"
                    >
                      <span className="text-lg sm:text-xl">📘</span>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Facebook</span>
                    </button>
                    <button
                      onClick={() => handleSocialShare('linkedin')}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-blue-50 rounded-lg transition text-left"
                    >
                      <span className="text-lg sm:text-xl">💼</span>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">LinkedIn</span>
                    </button>
                    <button
                      onClick={() => handleSocialShare('whatsapp')}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-green-50 rounded-lg transition text-left"
                    >
                      <span className="text-lg sm:text-xl">💬</span>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSocialShare('telegram')}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-blue-50 rounded-lg transition text-left"
                    >
                      <span className="text-lg sm:text-xl">✈️</span>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Telegram</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-gray-50 rounded-lg transition text-left"
                    >
                      <span className="text-lg sm:text-xl">{copied ? '✓' : '🔗'}</span>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-medium shadow-lg transform hover:scale-105 text-sm sm:text-base"
              >
                <span>📥</span>
                <span>Download</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium shadow transform hover:scale-105 text-sm sm:text-base"
              >
                <span>{copied ? '✓' : '🔗'}</span>
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{Number(clip.viral_score || 0).toFixed(0)}%</div>
                <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Viral Score</div>
              </div>
              <div className="text-center border-x border-purple-200">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatDuration(clip.duration)}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600 truncate px-1">{clip.emotion || 'N/A'}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Emotion</div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-center text-white shadow-xl">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🚀</div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                Create Your Own Viral Clips
              </h3>
              <p className="text-sm sm:text-base text-purple-100 mb-3 sm:mb-4">
                Turn your long videos into viral shorts with AI in seconds
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-bold shadow-lg transform hover:scale-105 text-sm sm:text-base"
              >
                Get Started Free →
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🤖</div>
            <h4 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">AI-Powered</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Smart AI finds the most viral moments automatically
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
            <h4 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Lightning Fast</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Generate multiple clips in seconds, not hours
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📈</div>
            <h4 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Viral Score</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              AI predicts viral potential of each clip
            </p>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-8 shadow-lg">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Loved by Content Creators</h3>
            <p className="text-sm sm:text-base text-gray-600">Join thousands of creators making viral content</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                  JD
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">John Doe</div>
                  <div className="text-xs sm:text-sm text-gray-600">YouTuber</div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 italic">"ClipForge AI helped me grow my channel 10x faster. The AI is incredibly accurate!"</p>
              <div className="mt-2 sm:mt-3 text-yellow-500 text-sm sm:text-base">⭐⭐⭐⭐⭐</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                  SK
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Sarah Kim</div>
                  <div className="text-xs sm:text-sm text-gray-600">Content Creator</div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 italic">"Best tool for creating shorts! Saves me hours of editing time every week."</p>
              <div className="mt-2 sm:mt-3 text-yellow-500 text-sm sm:text-base">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 py-6 sm:py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">© 2026 ClipForge AI. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <button onClick={() => navigate('/privacy')} className="text-gray-600 hover:text-purple-600 transition font-medium whitespace-nowrap">
                Privacy Policy
              </button>
              <span className="text-gray-400">•</span>
              <button onClick={() => navigate('/terms')} className="text-gray-600 hover:text-purple-600 transition font-medium whitespace-nowrap">
                Terms of Service
              </button>
              <span className="text-gray-400 hidden sm:inline">•</span>
              <button onClick={() => navigate('/about')} className="text-gray-600 hover:text-purple-600 transition font-medium whitespace-nowrap">
                About Us
              </button>
              <span className="text-gray-400">•</span>
              <button onClick={() => navigate('/contact')} className="text-gray-600 hover:text-purple-600 transition font-medium whitespace-nowrap">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ShareClip;
