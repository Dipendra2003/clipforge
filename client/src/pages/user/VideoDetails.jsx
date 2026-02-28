import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import { getVideoUrl, formatDuration, formatFileSize } from '../../utils/videoUrl';
import { getEmotionColor } from '../../utils/helpers';

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

  useEffect(() => {
    fetchVideoDetails();
  }, [videoId]);

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
        setVideo(data.video);
        setClips(data.clips || []);
        setEditTitle(data.video.title);
        setEditDescription(data.video.description || '');
      } else {
        toast.error('Failed to load video details');
        navigate('/videos');
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
      toast.error('Failed to load video details');
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error updating video:', error);
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
        navigate('/videos');
      } else {
        toast.error('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
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
        onClick={() => navigate('/videos')}
        className="mb-6 text-purple-600 hover:text-purple-700 flex items-center"
      >
        ← Back to Videos
      </button>

      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        <div className="aspect-video bg-gray-900 relative">
          {video.file_path ? (
            <video 
              key={video.id}
              src={getVideoUrl(video.file_path)}
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
              onError={(e) => {
                console.error('Video load error:', e);
                console.log('Attempted URL:', e.target.src);
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

              {video.has_subtitles && (
                <div className="flex items-center text-sm text-green-600 mb-4">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Subtitles available
                </div>
              )}

              <div className="text-xs text-gray-500">
                Created: {new Date(video.created_at).toLocaleString()}
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

      {clips.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Generated Clips ({clips.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip) => (
              <div key={clip.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
                <div className="aspect-video bg-gray-900 relative">
                  <video 
                    key={clip.id}
                    src={getVideoUrl(clip.file_path)}
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
                    onLoadStart={() => {
                      console.log('✅ Video loading started for clip:', clip.id);
                    }}
                    onLoadedMetadata={(e) => {
                      console.log('✅ Video loaded successfully!');
                      console.log('  - Duration:', e.target.duration);
                      console.log('  - Video dimensions:', e.target.videoWidth, 'x', e.target.videoHeight);
                    }}
                    onError={(e) => {
                      console.error('❌ Clip video load error!');
                      console.error('  - Clip ID:', clip.id);
                      console.error('  - Attempted URL:', e.target.src);
                      console.error('  - Original file_path:', clip.file_path);
                      console.error('  - Error:', e);
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(clip.duration)}
                  </div>
                  {clip.viral_score && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      🔥 {(clip.viral_score * 10 * 10).toFixed(0)}%
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{clip.title}</h3>
                  
                  {clip.emotion && (
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-3 ${getEmotionColor(clip.emotion)}`}>
                      {clip.emotion}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{clip.start_time}s - {clip.end_time}s</span>
                  </div>
                  
                  <a 
                    href={getVideoUrl(clip.file_path)}
                    download={`${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`}
                    onClick={(e) => {
                      e.preventDefault();
                      const url = getVideoUrl(clip.file_path);
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
                        .catch(error => {
                          console.error('Download error:', error);
                          toast.error('Failed to download clip');
                        });
                    }}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm text-center block"
                  >
                    Download Clip
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoDetails;
