import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import { getVideoUrl, formatDuration, formatFileSize, detectPlatform } from '../../utils/videoUrl';
import { getEmotionColor } from '../../utils/helpers';
import axios from 'axios';
import PostModal from '../../components/PostModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function VideoDetails() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sortBy, setSortBy] = useState('default'); // default, viral_score, duration
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [editingClipId, setEditingClipId] = useState(null);
  const [editingClipTitle, setEditingClipTitle] = useState('');
  const [selectedClips, setSelectedClips] = useState([]);
  const [postedClips, setPostedClips] = useState({});
  const [platformConnections, setPlatformConnections] = useState([]);
  const [showPostModal, setShowPostModal] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null); // { clip, deleteFromYouTube }

  useEffect(() => {
    fetchVideoDetails();
    fetchPublishedPosts();
    fetchPlatformConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Auto-refresh when there are pending/uploading posts
  useEffect(() => {
    const hasPendingPosts = Object.values(postedClips).some(post => 
      post.status === 'pending' || post.status === 'uploading'
    );

    if (hasPendingPosts) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing clips due to pending uploads...');
        fetchPublishedPosts();
        fetchVideoDetails();
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [postedClips]);

  const fetchVideoDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in again');
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Video data:', data.video);
        console.log('Clips data:', data.clips);
        setVideo(data.video);
        setClips(data.clips || []);
        setEditTitle(data.video.title);
        setEditDescription(data.video.description || '');
      } else {
        toast.error('Failed to load video details');
        navigate('/dashboard/videos');
      }
    } catch {
      toast.error('Failed to load video details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishedPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/post/my-posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched posts:', data.posts);
        
        // Create map of clipId -> post data for published/scheduled posts
        const postsMap = {};
        data.posts.forEach(post => {
          if (['published', 'scheduled', 'pending', 'uploading'].includes(post.status) && post.clip_id) {
            postsMap[post.clip_id] = post;
          }
        });
        console.log('Posted clips map:', postsMap);
        setPostedClips(postsMap);
      }
    } catch (error) {
      console.error('Error fetching published posts:', error);
    }
  };

  const fetchPlatformConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/platform/connections`);
      setPlatformConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching platform connections:', error);
    }
  };

  const isYouTubeConnected = () => {
    const youtubeConn = platformConnections.find(conn => conn.platform === 'youtube');
    return youtubeConn && youtubeConn.platformUserId && !youtubeConn.isExpired;
  };

  const getYouTubeConnectionStatus = () => {
    const youtubeConn = platformConnections.find(conn => conn.platform === 'youtube');
    if (!youtubeConn) return { connected: false, message: 'Not connected' };
    if (!youtubeConn.platformUserId) return { connected: false, message: 'Invalid connection' };
    if (youtubeConn.isExpired) return { connected: false, message: 'Connection expired' };
    return { connected: true, message: 'Connected' };
  };

  const handleOpenPostModal = (clip) => {
    const status = getYouTubeConnectionStatus();
    
    if (!status.connected) {
      if (status.message === 'Connection expired') {
        toast.error('YouTube connection expired. Please reconnect in Settings.');
      } else if (status.message === 'Invalid connection') {
        toast.error('YouTube connection is invalid. Please reconnect in Settings.');
      } else {
        toast.error('Please connect YouTube in Settings first');
      }
      return;
    }

    setShowPostModal(clip);
  };

  const handlePostSuccess = (postData) => {
    console.log('Post success data:', postData);
    
    // Update posted clips map immediately
    const clipId = postData.post?.clipId || postData.post?.clip_id;
    if (clipId) {
      setPostedClips(prev => ({
        ...prev,
        [clipId]: postData.post
      }));
    }
    
    // Refresh clips and posts to get latest status
    fetchVideoDetails();
    fetchPublishedPosts();
    
    // Show success message
    toast.success(postData.message || 'Posted successfully!');
  };

  const handleDeletePost = async (clip, deleteFromYouTube = false) => {
    const postData = getPostData(clip.id);
    if (!postData || !postData.id) {
      toast.error('Post data not found');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `${API_URL}/api/post/${postData.id}`,
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          data: { deleteFromPlatform: deleteFromYouTube }
        }
      );

      if (response.data.success) {
        if (response.data.deletedFromYouTube) {
          toast.success('Video deleted from YouTube and post record removed!');
        } else if (response.data.youtubeError) {
          toast.warning(`Post record removed, but YouTube deletion failed: ${response.data.youtubeError}`);
        } else {
          toast.success('Post record removed. You can now post this clip again!');
        }
        
        // Remove from posted clips map
        setPostedClips(prev => {
          const newMap = { ...prev };
          delete newMap[clip.id];
          return newMap;
        });
        
        // Refresh data
        fetchVideoDetails();
        fetchPublishedPosts();
      }
    } catch (error) {
      console.error('Delete post error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete post';
      toast.error(errorMessage);
    } finally {
      setShowDeleteDialog(null);
    }
  };

  const handleVerifyVideo = async (clip) => {
    const postData = getPostData(clip.id);
    if (!postData || !postData.id) {
      toast.error('Post data not found');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_URL}/api/post/${postData.id}/verify`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.exists) {
        toast.success('Video exists on YouTube! ✅');
      } else {
        toast.info('Video was deleted from YouTube. Post record updated.');
        
        // Remove from posted clips map
        setPostedClips(prev => {
          const newMap = { ...prev };
          delete newMap[clip.id];
          return newMap;
        });
        
        // Refresh data
        fetchVideoDetails();
        fetchPublishedPosts();
      }
    } catch (error) {
      console.error('Verify video error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to verify video';
      toast.error(errorMessage);
    }
  };

  const isClipPosted = (clipId) => {
    return !!postedClips[clipId];
  };

  const getPostData = (clipId) => {
    return postedClips[clipId];
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: editTitle,
          description: editDescription
        })
      });

      if (response.ok) {
        toast.success('Video updated successfully!');
        setEditingVideo(false);
        fetchVideoDetails();
      } else {
        toast.error('Failed to update video');
      }
    } catch {
      toast.error('Failed to update video');
    }
  };

  const handleDeleteVideo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Video deleted successfully!');
        navigate('/dashboard/videos');
      } else {
        toast.error('Failed to delete video');
      }
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/dashboard/videos/${videoId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleCopyClipLink = (clipId) => {
    const link = `${window.location.origin}/share/${clipId}`;
    navigator.clipboard.writeText(link);
    toast.success('Clip link copied to clipboard!');
  };

  const handleShareToSocial = (platform) => {
    const link = `${window.location.origin}/dashboard/videos/${videoId}`;
    const text = `Check out this video: ${video.title}`;
    
    let shareUrl = '';
    switch(platform) {
      case 'youtube':
        // Open YouTube upload page
        shareUrl = 'https://www.youtube.com/upload';
        toast.info('Opening YouTube upload page. You can upload your video there!');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const handleDownloadOriginal = () => {
    const url = getVideoUrl(video.file_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${video.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading original video...');
  };

  const handleBulkDownload = async () => {
    const clipsToDownload = selectedClips.length > 0 
      ? clips.filter(c => selectedClips.includes(c.id))
      : clips;
    
    toast.info(`Downloading ${clipsToDownload.length} clips...`);
    
    for (let i = 0; i < clipsToDownload.length; i++) {
      const clip = clipsToDownload[i];
      const url = getVideoUrl(clip.file_path, clip.cloud_url);
      
      try {
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
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch {
        toast.error(`Failed to download: ${clip.title}`);
      }
    }
    
    toast.success('All clips downloaded!');
    setSelectedClips([]);
  };

  const handleBulkDelete = async () => {
    if (selectedClips.length === 0) {
      toast.error('No clips selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedClips.length} selected clips?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      for (const clipId of selectedClips) {
        await fetch(`http://localhost:5000/api/clips/${clipId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      toast.success(`${selectedClips.length} clips deleted!`);
      setSelectedClips([]);
      fetchVideoDetails();
    } catch {
      toast.error('Failed to delete clips');
    }
  };

  const handleUpdateClipTitle = async (clipId, newTitle) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/clips/${clipId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        toast.success('Clip title updated!');
        setEditingClipId(null);
        fetchVideoDetails();
      } else {
        toast.error('Failed to update clip title');
      }
    } catch {
      toast.error('Failed to update clip title');
    }
  };

  const toggleClipSelection = (clipId) => {
    setSelectedClips(prev => 
      prev.includes(clipId) 
        ? prev.filter(id => id !== clipId)
        : [...prev, clipId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClips.length === clips.length) {
      setSelectedClips([]);
    } else {
      setSelectedClips(clips.map(c => c.id));
    }
  };

  // Get filtered and sorted clips
  const getFilteredAndSortedClips = () => {
    let filteredClips = [...clips];
    
    // Filter by emotion
    if (filterEmotion !== 'all') {
      filteredClips = filteredClips.filter(clip => 
        clip.emotion?.toLowerCase() === filterEmotion.toLowerCase()
      );
    }
    
    // Sort clips
    switch(sortBy) {
      case 'viral_score':
        filteredClips.sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));
        break;
      case 'duration':
        filteredClips.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      default:
        // Keep original order
        break;
    }
    
    return filteredClips;
  };

  // Get unique emotions from clips
  const getUniqueEmotions = () => {
    const emotions = clips.map(c => c.emotion).filter(Boolean);
    return [...new Set(emotions)];
  };

  // Get most popular clip
  const getMostPopularClip = () => {
    if (clips.length === 0) return null;
    return clips.reduce((max, clip) => 
      (clip.viral_score || 0) > (max.viral_score || 0) ? clip : max
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-gray-500">Video not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard/videos')}
        className="mb-6 text-purple-600 hover:text-purple-700 flex items-center"
      >
        ← Back to Videos
      </button>

      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        <div className="aspect-video bg-gray-900 relative">
          {video.file_path ? (
            <video 
              key={video.id}
              src={getVideoUrl(video.file_path, video.cloud_url)}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
              onPlay={(e) => {
                // Pause all other videos when this one plays
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach(video => {
                  if (video !== e.target) {
                    video.pause();
                  }
                });
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-6xl">
              🎬
            </div>
          )}
        </div>

        <div className="p-6">
          {editingVideo ? (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  placeholder="Video title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  placeholder="Video description"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingVideo(false);
                    setEditTitle(video.title);
                    setEditDescription(video.description || '');
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
                  {video.description && (
                    <p className="text-gray-600">{video.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingVideo(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="font-semibold">{formatDuration(video.duration)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">File Size</div>
                  <div className="font-semibold">{formatFileSize(video.file_size)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="font-semibold capitalize">{video.status}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Clips</div>
                  <div className="font-semibold">{clips.length}</div>
                </div>
              </div>

              {/* Video Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">Source</div>
                  <div className="font-semibold text-blue-900">
                    {detectPlatform(video.source_url).icon} {detectPlatform(video.source_url).name}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 mb-1">Most Popular</div>
                  <div className="font-semibold text-green-900">
                    {getMostPopularClip() ? `🔥 ${Number(getMostPopularClip().viral_score).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1">Created</div>
                  <div className="font-semibold text-purple-900 text-xs">
                    {new Date(video.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="text-xs text-orange-600 mb-1">Quality</div>
                  <div className="font-semibold text-orange-900">
                    {video.quality || '720p'}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span>📤</span> Share
                </button>
                <button
                  onClick={handleDownloadOriginal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <span>⬇️</span> Download Original
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <span>🔗</span> Copy Link
                </button>
              </div>

              {video.has_subtitles && (
                <div className="flex items-center text-sm text-green-600 mb-4">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Subtitles available
                </div>
              )}

              <div className="text-xs text-gray-500">
                Created: {new Date(video.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Video?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete the video and all {clips.length} associated clips. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteVideo}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share Video</h3>
            
            {/* Copy Link */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Video Link</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/dashboard/videos/${videoId}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-3">Share on Social Media</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShareToSocial('youtube')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <span className="text-xl">▶️</span>
                  YouTube
                </button>
                <button
                  onClick={() => handleShareToSocial('facebook')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <span className="text-xl">📘</span>
                  Facebook
                </button>
                <button
                  onClick={() => handleShareToSocial('twitter')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                >
                  <span className="text-xl">🐦</span>
                  Twitter
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {clips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Generated Clips ({getFilteredAndSortedClips().length})</h2>
          </div>

          {/* Clip Management Controls */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Select All */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClips.length === getFilteredAndSortedClips().length && getFilteredAndSortedClips().length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({selectedClips.length}/{getFilteredAndSortedClips().length})
                </span>
              </label>

              {/* Bulk Actions */}
              {selectedClips.length > 0 && (
                <>
                  <button
                    onClick={handleBulkDownload}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
                  >
                    <span>⬇️</span> Download Selected
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2"
                  >
                    <span>🗑️</span> Delete Selected
                  </button>
                </>
              )}

              {/* Sort By */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm font-medium text-gray-700">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600"
                >
                  <option value="default">Default Order</option>
                  <option value="viral_score">Viral Score (High to Low)</option>
                  <option value="duration">Duration (Long to Short)</option>
                </select>
              </div>

              {/* Filter by Emotion */}
              {getUniqueEmotions().length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filter:</label>
                  <select
                    value={filterEmotion}
                    onChange={(e) => setFilterEmotion(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="all">All Emotions</option>
                    {getUniqueEmotions().map(emotion => (
                      <option key={emotion} value={emotion}>{emotion}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAndSortedClips().map((clip) => (
              <div key={clip.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden relative">
                <div className="aspect-video bg-gray-900 relative">
                  {/* Selection Checkbox - Positioned in top-left corner */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedClips.includes(clip.id)}
                      onChange={() => toggleClipSelection(clip.id)}
                      className="w-5 h-5 text-purple-600 rounded cursor-pointer bg-white border-2 border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <video 
                    key={clip.id}
                    src={getVideoUrl(clip.file_path, clip.cloud_url)}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    onPlay={(e) => {
                      // Pause all other videos when this one plays
                      const allVideos = document.querySelectorAll('video');
                      allVideos.forEach(video => {
                        if (video !== e.target) {
                          video.pause();
                        }
                      });
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(clip.duration)}
                  </div>
                  {clip.viral_score && (
                    <div className="absolute bottom-3 left-3 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      🔥 {Number(clip.viral_score).toFixed(0)}%
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  {/* Editable Title */}
                  {editingClipId === clip.id ? (
                    <div className="mb-3">
                      <input
                        type="text"
                        value={editingClipTitle}
                        onChange={(e) => setEditingClipTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateClipTitle(clip.id, editingClipTitle)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingClipId(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">{clip.title}</h3>
                      <button
                        onClick={() => {
                          setEditingClipId(clip.id);
                          setEditingClipTitle(clip.title);
                        }}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  
                  {clip.emotion && (
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-3 ${getEmotionColor(clip.emotion)}`}>
                      {clip.emotion}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{clip.start_time}s - {clip.end_time}s</span>
                  </div>

                  {/* Post Status */}
                  {isClipPosted(clip.id) && (
                    <div className="mb-3">
                      {getPostData(clip.id).status === 'pending' && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 text-xs">
                          <span className="animate-spin">⏳</span>
                          <span className="font-medium">Uploading...</span>
                        </div>
                      )}
                      {getPostData(clip.id).status === 'uploading' && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 text-xs">
                          <span className="animate-spin">⏳</span>
                          <span className="font-medium">Uploading...</span>
                        </div>
                      )}
                      {getPostData(clip.id).status === 'scheduled' && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-xs">
                          <span>📅</span>
                          <span className="font-medium">Scheduled</span>
                        </div>
                      )}
                      {getPostData(clip.id).status === 'published' && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-xs">
                          <span className="font-medium">✅ Posted</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {/* Posted Status or Post Button */}
                    {isClipPosted(clip.id) ? (
                      <div className="space-y-2">
                        {/* Action Buttons - Only show for published/scheduled posts with video URL */}
                        {(getPostData(clip.id).status === 'published' || getPostData(clip.id).status === 'scheduled') && getPostData(clip.id).platform_url && (
                          <div className="flex gap-2">
                            <a
                              href={getPostData(clip.id).platform_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                            >
                              🔗 View on YouTube
                            </a>
                            <button
                              onClick={() => handleVerifyVideo(clip)}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                              title="Check if video still exists on YouTube"
                            >
                              🔍
                            </button>
                          </div>
                        )}
                        
                        {/* Delete/Cancel Button */}
                        {getPostData(clip.id).status === 'published' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => setShowDeleteDialog({ clip, deleteFromYouTube: true })}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                            >
                              🗑️ Delete from YouTube
                            </button>
                            <button
                              onClick={() => setShowDeleteDialog({ clip, deleteFromYouTube: false })}
                              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                            >
                              � Remove Record Only
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                              Delete from YouTube to permanently remove the video, or just remove the record to post again.
                            </p>
                          </div>
                        )}
                        
                        {(getPostData(clip.id).status === 'scheduled' || getPostData(clip.id).status === 'pending' || getPostData(clip.id).status === 'uploading') && (
                          <>
                            <button
                              onClick={() => {
                                // Navigate to scheduled posts page
                                window.location.href = '/dashboard/scheduled';
                              }}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                            >
                              📅 View in Scheduled Posts
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                              You can cancel this scheduled post from the Scheduled Posts page.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <a 
                            href={getVideoUrl(clip.file_path, clip.cloud_url)}
                            download={`${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`}
                            onClick={(e) => {
                              e.preventDefault();
                              const url = getVideoUrl(clip.file_path, clip.cloud_url);
                              fetch(url)
                                .then(response => response.blob())
                                .then(blob => {
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = `${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(blobUrl);
                                  toast.success('Downloading clip...');
                                })
                                .catch(() => {
                                  toast.error('Failed to download clip');
                                });
                            }}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm text-center"
                          >
                            📥 Download
                          </a>
                          <button
                            onClick={() => handleOpenPostModal(clip)}
                            disabled={!isYouTubeConnected()}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ▶️ Post to YouTube
                          </button>
                        </div>
                        {!isYouTubeConnected() && (
                          <div className="text-xs text-center">
                            <span className="text-gray-500">
                              {getYouTubeConnectionStatus().message === 'Connection expired' 
                                ? '⚠️ YouTube connection expired - Reconnect in Settings'
                                : getYouTubeConnectionStatus().message === 'Invalid connection'
                                ? '⚠️ YouTube connection invalid - Reconnect in Settings'
                                : 'Connect YouTube in Settings to post clips'}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Copy Clip Link Button */}
                    <button
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      onClick={() => handleCopyClipLink(clip.id)}
                    >
                      🔗 Copy Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowDeleteDialog(null)}
        >
          <div 
            className="bg-gradient-to-b from-gray-50 to-white rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">localhost:5173 says</h3>
              <div className="h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
            </div>
            
            {showDeleteDialog.deleteFromYouTube ? (
              <>
                <p className="text-gray-700 mb-2 text-base leading-relaxed">
                  Delete this video from YouTube AND remove the post record?
                </p>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                  This will permanently delete the video from your YouTube channel!
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-2 text-base leading-relaxed">
                  Remove the post record only?
                </p>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                  The video will remain on YouTube, but you'll be able to post this clip again.
                </p>
              </>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  handleDeletePost(showDeleteDialog.clip, showDeleteDialog.deleteFromYouTube);
                }}
                className="px-10 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                OK
              </button>
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-10 py-3 bg-gradient-to-r from-yellow-100 to-yellow-200 text-gray-800 rounded-full hover:from-yellow-200 hover:to-yellow-300 transition-all duration-200 font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <PostModal
          clip={showPostModal}
          onClose={() => setShowPostModal(null)}
          onSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
}

export default VideoDetails;
