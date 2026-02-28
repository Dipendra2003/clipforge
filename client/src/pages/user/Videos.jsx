import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import { getVideoUrl, formatDuration, formatFileSize } from '../../utils/videoUrl';
import { getStatusBadge } from '../../utils/helpers';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in again');
        return;
      }

      console.log('Fetching videos with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:5000/api/videos/my-videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Videos response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Videos data:', data);
        setVideos(data.videos);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to load videos:', errorData);
        toast.error(`Failed to load videos: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error(`Failed to load videos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video.id);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
  };

  const handleSaveEdit = async (videoId) => {
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
        setEditingVideo(null);
        fetchVideos();
      } else {
        toast.error('Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Failed to update video');
    }
  };

  const handleDeleteVideo = async (videoId) => {
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
        setShowDeleteConfirm(null);
        fetchVideos();
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Videos</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Upload New Video
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos yet</h3>
          <p className="text-gray-500 mb-6">Upload your first video to get started</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Upload Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
              <div className="aspect-video bg-gray-900 relative">
                {video.thumbnail_path ? (
                  <img 
                    src={getVideoUrl(video.thumbnail_path)} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="fallback-icon flex items-center justify-center h-full text-white text-4xl" style={{ display: video.thumbnail_path ? 'none' : 'flex' }}>
                  🎬
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(video.status)}`}>
                    {video.status}
                  </span>
                </div>
                {video.duration > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {editingVideo === video.id ? (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 mb-2"
                      placeholder="Video title"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 mb-2"
                      placeholder="Video description"
                      rows="2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(video.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingVideo(null)}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{video.title}</h3>
                    
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{formatFileSize(video.file_size)}</span>
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>

                    {video.has_subtitles && (
                      <div className="flex items-center text-xs text-green-600 mb-3">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Subtitles available
                      </div>
                    )}
                    
                    {showDeleteConfirm === video.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-red-800 mb-2">Delete this video and all clips?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button 
                          onClick={() => navigate(`/dashboard/videos/${video.id}`)}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                        >
                          View Details
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditVideo(video)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(video.id)}
                            className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                            title="Delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Videos;
