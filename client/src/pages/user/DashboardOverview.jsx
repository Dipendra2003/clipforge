import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from '../../utils/toast';
import { getVideoUrl } from '../../utils/videoUrl';

function DashboardOverview() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Video processing states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [demoVideo, setDemoVideo] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedClips, setGeneratedClips] = useState([]);
  const [showClips, setShowClips] = useState(false);
  
  // Advanced options (simplified for dashboard)
  const [fastMode, setFastMode] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clipMode, setClipMode] = useState('ai');
  const [clipDuration, setClipDuration] = useState(45);
  const [numClips, setNumClips] = useState(5);
  const [videoQuality, setVideoQuality] = useState('720p');
  const [subtitleLanguage, setSubtitleLanguage] = useState('auto');
  const [startMinutes, setStartMinutes] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endMinutes, setEndMinutes] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [divideMinutes, setDivideMinutes] = useState(0);
  const [divideSeconds, setDivideSeconds] = useState(45);

  // Stats state
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalClips: 0,
    scheduledPosts: 0,
    totalViews: 0
  });

  // Activity state
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Load stats and recent clips on mount
  useEffect(() => {
    loadStats();
    loadRecentClips();
    loadRecentActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      // Fetch dashboard stats from new endpoint
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/user/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalVideos: statsData.totalVideos || 0,
          totalClips: statsData.totalClips || 0,
          scheduledPosts: statsData.scheduledPosts || 0,
          totalViews: statsData.totalViews || 0
        });
      }
    } catch {
      // Silent error handling
    }
  };

  const loadRecentActivity = async () => {
    try {
      setLoadingActivity(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setRecentActivity([]);
        setLoadingActivity(false);
        return;
      }

      const activityResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/user/dashboard/activity?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        const activities = activityData.activities || [];
        
        
        setRecentActivity(activities);
      } else {
        setRecentActivity([]);
      }
    } catch {
      setRecentActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const loadRecentClips = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/clips/my-clips?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.clips && data.clips.length > 0) {
          setGeneratedClips(data.clips);
          setShowClips(true);
        }
        // Reload stats to update clip count
        loadStats();
      } else {
        await response.json().catch(() => ({}));
      }
    } catch {
      // Silent error handling
    }
  };

  const statsDisplay = [
    { label: 'Total Videos', value: stats.totalVideos, icon: '🎬', color: 'purple' },
    { label: 'Total Clips', value: stats.totalClips, icon: '✂️', color: 'indigo' },
    { label: 'Scheduled Posts', value: stats.scheduledPosts, icon: '📅', color: 'blue' },
    { label: 'Total Views', value: stats.totalViews, icon: '👁️', color: 'green' },
  ];

  const quickActions = [
    { label: 'My Videos', icon: '🎬', path: '/dashboard/videos', color: 'purple' },
    { label: 'View Clips', icon: '✂️', path: '/dashboard/clips', color: 'indigo' },
    { label: 'Schedule Post', icon: '📅', path: '/dashboard/scheduled', color: 'blue' },
    { label: 'Analytics', icon: '📊', path: '/dashboard/analytics', color: 'green' },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }
    
    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 500MB');
      return;
    }
    
    setUploadedFile(file);
    
    // Create video preview URL
    const videoUrl = URL.createObjectURL(file);
    setDemoVideo(videoUrl);
    
    toast.success(`Video "${file.name}" uploaded successfully!`);
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setProcessing(true);
    setProcessingStep('Downloading video from YouTube...');
    setProcessingProgress(0);
    
    let downloadProgressInterval = null;
    let progressPollInterval = null;
    
    // Simulate download progress
    downloadProgressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev < 25) return prev + 1;
        return prev;
      });
    }, 1200);
    
    try {
      toast.info('📥 Downloading video from YouTube...');
      
      const downloadResponse = await fetch('http://localhost:5001/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: youtubeUrl,
          quality: videoQuality 
        }),
      });

      if (downloadProgressInterval) clearInterval(downloadProgressInterval);
      const downloadData = await downloadResponse.json();

      if (!downloadResponse.ok) {
        if (downloadResponse.status === 403) {
          toast.error('⚠️ YouTube bot detection triggered');
        } else if (downloadResponse.status === 404) {
          toast.error('❌ Video unavailable or private');
        } else if (downloadResponse.status === 429) {
          toast.error('⚠️ Rate limited by YouTube');
        } else {
          toast.error(`Error: ${downloadData.error || 'Failed to download video'}`);
        }
        return;
      }

      const subtitleMsg = downloadData.hasSubtitles ? ' with subtitles' : ' (subtitles unavailable)';
      toast.success(`✅ Video downloaded${subtitleMsg}: ${downloadData.title || 'Success'}`);
      
      setProcessingStep('Video downloaded successfully');
      setProcessingProgress(30);
      
      // Extract video ID
      const urlParts = downloadData.videoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const extractedVideoId = filename.replace('.mp4', '');
      
      setDemoVideo(downloadData.videoUrl);
      setVideoId(extractedVideoId);
      
      // Process video with AI
      setProcessingStep('AI analyzing video...');
      setProcessingProgress(35);
      toast.info('🤖 AI is analyzing your video and generating clips...');
      
      // Get user ID
      const token = localStorage.getItem('accessToken');
      let userId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch {
          console.log('Token parse error');
        }
      }
      
      const processingOptions = {
        videoId: extractedVideoId,
        userId: userId,
        skipSubtitles: fastMode,
        clipMode: clipMode,
        numClips: numClips,
        quality: videoQuality,
        subtitleLanguage: subtitleLanguage !== 'auto' ? subtitleLanguage : null
      };
      
      if (clipMode === 'ai') {
        processingOptions.clipDuration = clipDuration;
      } else if (clipMode === 'divide') {
        const divideDuration = divideMinutes * 60 + divideSeconds;
        processingOptions.clipDuration = divideDuration;
        processingOptions.numClips = 0;
      } else if (clipMode === 'range') {
        const startTime = startMinutes * 60 + startSeconds;
        const endTime = endMinutes * 60 + endSeconds;
        processingOptions.startTime = startTime;
        processingOptions.endTime = endTime;
        processingOptions.clipDuration = clipDuration;
      }
      
      // Start progress polling
      progressPollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`http://localhost:5001/progress/${extractedVideoId}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.progress > 0) {
              setProcessingProgress(progressData.progress);
              setProcessingStep(progressData.step || 'Processing...');
            }
            
            if (progressData.status === 'completed' || progressData.status === 'failed') {
              clearInterval(progressPollInterval);
            }
          }
        } catch (error) {
          console.error('Progress poll error:', error);
        }
      }, 500);
      
      const processResponse = await fetch('http://localhost:5001/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingOptions)
      });

      if (!processResponse.ok) {
        clearInterval(progressPollInterval);
        const errorData = await processResponse.json();
        toast.error(`Processing failed: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const processData = await processResponse.json();
      
      clearInterval(progressPollInterval);
      
      setProcessingProgress(100);
      setProcessingStep('Complete! 🎉');
      
      if (!processData.clips || processData.clips.length === 0) {
        toast.warning('⚠️ No clips were generated');
        return;
      }
      
      toast.success(`🎉 Success! Generated ${processData.clips.length} viral clips!`);
      
      // Save to database via Node.js backend
      try {
        const token = localStorage.getItem('accessToken');
        const saveResponse = await fetch('http://localhost:5000/api/videos/save-processed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoId: extractedVideoId,
            userId: userId,
            videoInfo: processData.videoInfo || {},
            clips: processData.clips,
            subtitleUrl: processData.subtitleUrl,
            thumbnailUrl: processData.thumbnailUrl,
            thumbnailCloudUrl: processData.thumbnailCloudUrl || null,
            detectedLanguage: processData.detectedLanguage
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Clips saved to database');
          toast.success('Clips saved successfully!');
          // Reload clips from database to get proper IDs
          await loadRecentClips();
        } else {
          console.warn('⚠️ Failed to save to database');
        }
      } catch (saveError) {
        console.error('Database save error:', saveError);
      }
      
      // Also show the newly generated clips immediately
      setGeneratedClips(processData.clips);
      setShowClips(true);
      setYoutubeUrl('');
      
      // Scroll to clips
      setTimeout(() => {
        const clipsSection = document.getElementById('clips-section');
        if (clipsSection) {
          clipsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
    } catch {
      toast.error('Failed to connect to server. Make sure Flask server is running on port 5001.');
    } finally {
      if (downloadProgressInterval) clearInterval(downloadProgressInterval);
      if (progressPollInterval) clearInterval(progressPollInterval);
      
      setProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  const processUploadedVideo = async () => {
    if (!uploadedFile && !demoVideo) {
      toast.error('Please upload a video first');
      return;
    }

    setProcessing(true);
    setProcessingStep('Preparing video...');
    setProcessingProgress(0);
    
    let uploadProgressInterval = null;
    let progressPollInterval = null;
    
    // Simulate upload progress
    uploadProgressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev < 20) return prev + 2;
        return prev;
      });
    }, 500);
    
    try {
      let processVideoId = videoId;
      
      // Upload video if it's a file
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('video', uploadedFile);

        setProcessingStep('Uploading video to server...');
        toast.info('📤 Uploading video...');
        
        const uploadResponse = await fetch('http://localhost:5001/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadProgressInterval) clearInterval(uploadProgressInterval);

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload video');
        }

        const uploadData = await uploadResponse.json();
        processVideoId = uploadData.videoId;
        toast.success('✅ Video uploaded!');
        setProcessingProgress(25);
      } else {
        if (uploadProgressInterval) clearInterval(uploadProgressInterval);
        setProcessingProgress(25);
      }

      // Get user ID
      const token = localStorage.getItem('accessToken');
      let userId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch {
          console.log('Token parse error');
        }
      }

      setProcessingStep('AI analyzing video...');
      setProcessingProgress(30);
      toast.info('🤖 AI is analyzing your video...');
      
      const processingOptions = {
        videoId: processVideoId,
        userId: userId,
        skipSubtitles: fastMode,
        clipMode: clipMode,
        numClips: numClips,
        quality: videoQuality,
        subtitleLanguage: subtitleLanguage !== 'auto' ? subtitleLanguage : null
      };
      
      if (clipMode === 'ai') {
        processingOptions.clipDuration = clipDuration;
      } else if (clipMode === 'divide') {
        const divideDuration = divideMinutes * 60 + divideSeconds;
        processingOptions.clipDuration = divideDuration;
        processingOptions.numClips = 0;
      } else if (clipMode === 'range') {
        const startTime = startMinutes * 60 + startSeconds;
        const endTime = endMinutes * 60 + endSeconds;
        processingOptions.startTime = startTime;
        processingOptions.endTime = endTime;
        processingOptions.clipDuration = clipDuration;
      }
      
      // Start progress polling
      progressPollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`http://localhost:5001/progress/${processVideoId}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.progress > 0) {
              setProcessingProgress(progressData.progress);
              setProcessingStep(progressData.step || 'Processing...');
            }
            
            if (progressData.status === 'completed' || progressData.status === 'failed') {
              clearInterval(progressPollInterval);
            }
          }
        } catch (error) {
          console.error('Progress poll error:', error);
        }
      }, 500);
      
      const processResponse = await fetch('http://localhost:5001/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingOptions)
      });

      if (!processResponse.ok) {
        clearInterval(progressPollInterval);
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      const processData = await processResponse.json();
      
      clearInterval(progressPollInterval);
      
      setProcessingProgress(100);
      setProcessingStep('Complete! 🎉');
      
      toast.success(`🎉 Success! Generated ${processData.clips.length} viral clips!`);
      
      // Save to database via Node.js backend
      try {
        const token = localStorage.getItem('accessToken');
        let userId = null;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId;
          } catch {
            console.log('Token parse error');
          }
        }

        const saveResponse = await fetch('http://localhost:5000/api/videos/save-processed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoId: processVideoId,
            userId: userId,
            videoInfo: processData.videoInfo || {},
            clips: processData.clips,
            subtitleUrl: processData.subtitleUrl,
            thumbnailUrl: processData.thumbnailUrl,
            thumbnailCloudUrl: processData.thumbnailCloudUrl || null,
            detectedLanguage: processData.detectedLanguage
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Clips saved to database');
          toast.success('Clips saved successfully!');
          // Reload clips from database to get proper IDs
          await loadRecentClips();
        } else {
          console.warn('⚠️ Failed to save to database');
        }
      } catch (saveError) {
        console.error('Database save error:', saveError);
      }
      
      // Also show the newly generated clips immediately
      setGeneratedClips(processData.clips);
      setShowClips(true);
      
      // Scroll to clips
      setTimeout(() => {
        const clipsSection = document.getElementById('clips-section');
        if (clipsSection) {
          clipsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);

    } catch (error) {
      toast.error(error.message || 'Failed to process video.');
    } finally {
      if (uploadProgressInterval) clearInterval(uploadProgressInterval);
      if (progressPollInterval) clearInterval(progressPollInterval);
      
      setProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-purple-100">Ready to create some viral clips?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Clip</h2>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'upload'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manual Upload
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'youtube'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            YouTube Link
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            {demoVideo ? (
              <div>
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                  <video 
                    src={demoVideo} 
                    controls 
                    className="w-full h-full"
                    onPlay={(e) => {
                      // Pause all other videos when this one plays
                      const allVideos = document.querySelectorAll('video');
                      allVideos.forEach(video => {
                        if (video !== e.target) {
                          video.pause();
                        }
                      });
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{uploadedFile?.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {(uploadedFile?.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDemoVideo(null);
                      setUploadedFile(null);
                      setVideoId(null);
                      setGeneratedClips([]);
                      setShowClips(false);
                    }}
                    className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Advanced Options for Upload */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    <span className="font-semibold text-gray-900">
                      ⚙️ Advanced Options
                    </span>
                    <span className="text-gray-600">
                      {showAdvanced ? '▲' : '▼'}
                    </span>
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4 border-2 border-gray-200">
                      {/* Clip Mode Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          🎯 Clip Generation Mode
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-purple-400 transition"
                            style={{ borderColor: clipMode === 'ai' ? '#9333ea' : '#e5e7eb' }}>
                            <input
                              type="radio"
                              name="clipMode"
                              value="ai"
                              checked={clipMode === 'ai'}
                              onChange={(e) => setClipMode(e.target.value)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <div className="ml-3">
                              <span className="font-semibold text-gray-900">🤖 AI Smart Selection</span>
                              <p className="text-xs text-gray-600">AI finds the most viral moments</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-purple-400 transition"
                            style={{ borderColor: clipMode === 'divide' ? '#9333ea' : '#e5e7eb' }}>
                            <input
                              type="radio"
                              name="clipMode"
                              value="divide"
                              checked={clipMode === 'divide'}
                              onChange={(e) => setClipMode(e.target.value)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <div className="ml-3">
                              <span className="font-semibold text-gray-900">✂️ Divide Entire Video</span>
                              <p className="text-xs text-gray-600">Split whole video into equal clips</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-purple-400 transition"
                            style={{ borderColor: clipMode === 'range' ? '#9333ea' : '#e5e7eb' }}>
                            <input
                              type="radio"
                              name="clipMode"
                              value="range"
                              checked={clipMode === 'range'}
                              onChange={(e) => setClipMode(e.target.value)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <div className="ml-3">
                              <span className="font-semibold text-gray-900">⏱️ Custom Time Range</span>
                              <p className="text-xs text-gray-600">Specify start and end timestamps</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* AI Mode Options */}
                      {clipMode === 'ai' && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              ⏱️ Clip Duration: {clipDuration} seconds
                            </label>
                            <input
                              type="range"
                              min="15"
                              max="90"
                              step="15"
                              value={clipDuration}
                              onChange={(e) => setClipDuration(parseInt(e.target.value))}
                              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-600 mt-1">
                              <span>15s (Short)</span>
                              <span>45s (Medium)</span>
                              <span>90s (Long)</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              🎬 Number of Clips: {numClips}
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={numClips}
                              onChange={(e) => setNumClips(parseInt(e.target.value))}
                              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-600 mt-1">
                              <span>1 clip</span>
                              <span>5 clips</span>
                              <span>10 clips</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Divide Mode Options */}
                      {clipMode === 'divide' && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            ⏱️ Clip Duration (Each Part)
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Minutes</label>
                              <input
                                type="number"
                                min="0"
                                max="60"
                                value={divideMinutes}
                                onChange={(e) => setDivideMinutes(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Seconds</label>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={divideSeconds}
                                onChange={(e) => setDivideSeconds(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            💡 Total: {divideMinutes}m {divideSeconds}s per clip
                          </p>
                        </div>
                      )}

                      {/* Range Mode Options */}
                      {clipMode === 'range' && (
                        <>
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              ▶️ Start Time
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">Minutes</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={startMinutes}
                                  onChange={(e) => setStartMinutes(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">Seconds</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={startSeconds}
                                  onChange={(e) => setStartSeconds(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              ⏹️ End Time
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">Minutes</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={endMinutes}
                                  onChange={(e) => setEndMinutes(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">Seconds</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={endSeconds}
                                  onChange={(e) => setEndSeconds(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              ⏱️ Clip Duration: {clipDuration} seconds
                            </label>
                            <input
                              type="range"
                              min="15"
                              max="90"
                              step="15"
                              value={clipDuration}
                              onChange={(e) => setClipDuration(parseInt(e.target.value))}
                              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              🎬 Number of Clips: {numClips}
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={numClips}
                              onChange={(e) => setNumClips(parseInt(e.target.value))}
                              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <p className="text-xs text-orange-700 p-2 bg-orange-100 rounded">
                            💡 Range: {startMinutes}:{startSeconds.toString().padStart(2, '0')} to {endMinutes}:{endSeconds.toString().padStart(2, '0')}
                          </p>
                        </>
                      )}

                      {/* Video Quality Selection */}
                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          🎥 Video Quality
                        </label>
                        <select
                          value={videoQuality}
                          onChange={(e) => setVideoQuality(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white"
                        >
                          <option value="2160p">2160p (4K) - Highest Quality</option>
                          <option value="1440p">1440p (2K) - High Quality</option>
                          <option value="1080p">1080p (Full HD)</option>
                          <option value="720p">720p (HD) - Recommended</option>
                          <option value="480p">480p (SD)</option>
                          <option value="360p">360p - Fastest</option>
                        </select>
                        <p className="text-xs text-indigo-700 mt-2">
                          💡 Higher quality = larger file size & longer processing time
                        </p>
                      </div>

                      {/* Subtitle Language Selection */}
                      {!fastMode && (
                        <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            🗣️ Subtitle Language
                          </label>
                          <select
                            value={subtitleLanguage}
                            onChange={(e) => setSubtitleLanguage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white"
                          >
                            <option value="auto">Auto-Detect</option>
                            <option value="en">English</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="es">Spanish (Español)</option>
                            <option value="fr">French (Français)</option>
                            <option value="de">German (Deutsch)</option>
                            <option value="it">Italian (Italiano)</option>
                            <option value="pt">Portuguese (Português)</option>
                            <option value="ru">Russian (Русский)</option>
                            <option value="ja">Japanese (日本語)</option>
                            <option value="ko">Korean (한국어)</option>
                            <option value="zh">Chinese (中文)</option>
                            <option value="ar">Arabic (العربية)</option>
                            <option value="tr">Turkish (Türkçe)</option>
                            <option value="nl">Dutch (Nederlands)</option>
                            <option value="pl">Polish (Polski)</option>
                            <option value="sv">Swedish (Svenska)</option>
                            <option value="da">Danish (Dansk)</option>
                            <option value="no">Norwegian (Norsk)</option>
                            <option value="fi">Finnish (Suomi)</option>
                          </select>
                          <p className="text-xs text-teal-700 mt-2">
                            💡 Specify language for better subtitle accuracy
                          </p>
                        </div>
                      )}

                      {/* Fast Mode Toggle */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fastMode}
                            onChange={(e) => setFastMode(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="ml-2 text-sm font-semibold text-gray-900">
                            ⚡ Fast Mode (Skip Subtitles)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {processing && (
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-purple-900">
                        {processingStep || 'Processing...'}
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {processingProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">
                      ⏳ Please wait, this may take a few minutes...
                    </p>
                  </div>
                )}

                <button
                  onClick={processUploadedVideo}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    '🎬 Generate Viral Clips with AI'
                  )}
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
                  dragActive ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
                }`}
              >
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drag & drop your video here
                </h3>
                <p className="text-gray-500 mb-4">or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <span className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 cursor-pointer inline-block">
                    Browse Files
                  </span>
                </label>
                <p className="text-sm text-gray-400 mt-4">
                  Supported formats: MP4, MOV, AVI, MKV (Max 500MB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === 'youtube' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Paste YouTube Video URL
              </h3>
              <p className="text-gray-500">
                We'll download and process the video for you
              </p>
            </div>

            {/* Fast Mode Toggle */}
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fastMode}
                    onChange={(e) => setFastMode(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <span className="text-lg font-semibold text-gray-900">
                      ⚡ Fast Mode {fastMode ? 'ON' : 'OFF'}
                    </span>
                    <p className="text-sm text-gray-600">
                      {fastMode 
                        ? '10x faster! Clips without subtitles (recommended)' 
                        : 'Slower but includes auto-generated subtitles'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  fastMode ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {fastMode ? '~30 sec' : '~5 min'}
                </span>
              </label>
            </div>

            {/* Advanced Options for YouTube */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <span className="font-semibold text-gray-900">
                  ⚙️ Advanced Options
                </span>
                <span className="text-gray-600">
                  {showAdvanced ? '▲' : '▼'}
                </span>
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4 border-2 border-gray-200">
                  {/* Same advanced options as upload tab */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      🎯 Clip Generation Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-purple-400 transition"
                        style={{ borderColor: clipMode === 'ai' ? '#9333ea' : '#e5e7eb' }}>
                        <input
                          type="radio"
                          name="clipModeYT"
                          value="ai"
                          checked={clipMode === 'ai'}
                          onChange={(e) => setClipMode(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="ml-3">
                          <span className="font-semibold text-gray-900">🤖 AI Smart Selection</span>
                          <p className="text-xs text-gray-600">AI finds the most viral moments</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-purple-400 transition"
                        style={{ borderColor: clipMode === 'divide' ? '#9333ea' : '#e5e7eb' }}>
                        <input
                          type="radio"
                          name="clipModeYT"
                          value="divide"
                          checked={clipMode === 'divide'}
                          onChange={(e) => setClipMode(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="ml-3">
                          <span className="font-semibold text-gray-900">✂️ Divide Entire Video</span>
                          <p className="text-xs text-gray-600">Split whole video into equal clips</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-purple-400 transition"
                        style={{ borderColor: clipMode === 'range' ? '#9333ea' : '#e5e7eb' }}>
                        <input
                          type="radio"
                          name="clipModeYT"
                          value="range"
                          checked={clipMode === 'range'}
                          onChange={(e) => setClipMode(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="ml-3">
                          <span className="font-semibold text-gray-900">⏱️ Custom Time Range</span>
                          <p className="text-xs text-gray-600">Specify start and end timestamps</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {clipMode === 'ai' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          ⏱️ Clip Duration: {clipDuration} seconds
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="90"
                          step="15"
                          value={clipDuration}
                          onChange={(e) => setClipDuration(parseInt(e.target.value))}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>15s</span>
                          <span>45s</span>
                          <span>90s</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          🎬 Number of Clips: {numClips}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={numClips}
                          onChange={(e) => setNumClips(parseInt(e.target.value))}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>1</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    </>
                  )}

                  {clipMode === 'divide' && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        ⏱️ Clip Duration (Each Part)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Minutes</label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={divideMinutes}
                            onChange={(e) => setDivideMinutes(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Seconds</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={divideSeconds}
                            onChange={(e) => setDivideSeconds(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        💡 Total: {divideMinutes}m {divideSeconds}s per clip
                      </p>
                    </div>
                  )}

                  {clipMode === 'range' && (
                    <>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          ▶️ Start Time
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600">Minutes</label>
                            <input
                              type="number"
                              min="0"
                              value={startMinutes}
                              onChange={(e) => setStartMinutes(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600">Seconds</label>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={startSeconds}
                              onChange={(e) => setStartSeconds(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          ⏹️ End Time
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600">Minutes</label>
                            <input
                              type="number"
                              min="0"
                              value={endMinutes}
                              onChange={(e) => setEndMinutes(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600">Seconds</label>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={endSeconds}
                              onChange={(e) => setEndSeconds(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          ⏱️ Clip Duration: {clipDuration} seconds
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="90"
                          step="15"
                          value={clipDuration}
                          onChange={(e) => setClipDuration(parseInt(e.target.value))}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          🎬 Number of Clips: {numClips}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={numClips}
                          onChange={(e) => setNumClips(parseInt(e.target.value))}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <p className="text-xs text-orange-700 p-2 bg-orange-100 rounded">
                        💡 Range: {startMinutes}:{startSeconds.toString().padStart(2, '0')} to {endMinutes}:{endSeconds.toString().padStart(2, '0')}
                      </p>
                    </>
                  )}

                  {/* Video Quality Selection */}
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      🎥 Video Quality
                    </label>
                    <select
                      value={videoQuality}
                      onChange={(e) => setVideoQuality(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white"
                    >
                      <option value="2160p">2160p (4K) - Highest Quality</option>
                      <option value="1440p">1440p (2K) - High Quality</option>
                      <option value="1080p">1080p (Full HD)</option>
                      <option value="720p">720p (HD) - Recommended</option>
                      <option value="480p">480p (SD)</option>
                      <option value="360p">360p - Fastest</option>
                    </select>
                    <p className="text-xs text-indigo-700 mt-2">
                      💡 Higher quality = larger file size & longer processing time
                    </p>
                  </div>

                  {/* Subtitle Language Selection */}
                  {!fastMode && (
                    <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        🗣️ Subtitle Language
                      </label>
                      <select
                        value={subtitleLanguage}
                        onChange={(e) => setSubtitleLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 bg-white"
                      >
                        <option value="auto">Auto-Detect</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="fr">French (Français)</option>
                        <option value="de">German (Deutsch)</option>
                        <option value="it">Italian (Italiano)</option>
                        <option value="pt">Portuguese (Português)</option>
                        <option value="ru">Russian (Русский)</option>
                        <option value="ja">Japanese (日本語)</option>
                        <option value="ko">Korean (한국어)</option>
                        <option value="zh">Chinese (中文)</option>
                        <option value="ar">Arabic (العربية)</option>
                        <option value="tr">Turkish (Türkçe)</option>
                        <option value="nl">Dutch (Nederlands)</option>
                        <option value="pl">Polish (Polski)</option>
                        <option value="sv">Swedish (Svenska)</option>
                        <option value="da">Danish (Dansk)</option>
                        <option value="no">Norwegian (Norsk)</option>
                        <option value="fi">Finnish (Suomi)</option>
                      </select>
                      <p className="text-xs text-teal-700 mt-2">
                        💡 Specify language for better subtitle accuracy
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleYoutubeSubmit} className="space-y-4">
              <input
                type="url"
                required
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={processing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
              
              {/* Progress Indicator */}
              {processing && (
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-900">
                      {processingStep || 'Processing...'}
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      {processingProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-700 mt-2">
                    ⏳ Please wait, this may take a few minutes...
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  '🚀 Download & Generate Clips Automatically'
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Generated Clips Section */}
      {showClips && generatedClips.length > 0 && (
        <div id="clips-section" className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎬 Your Viral Clips Are Ready!
            </h2>
            <p className="text-gray-600">
              {generatedClips.length} clips generated • Click to preview and download
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedClips.map((clip, index) => (
              <div key={clip.id || index} className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition">
                {/* Video Preview */}
                <div className="aspect-video bg-black">
                  <video 
                    key={clip.id || clip.file_path || index}
                    src={getVideoUrl(clip.clipUrl || clip.file_path)}
                    controls 
                    className="w-full h-full"
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
                    onError={() => {
                      // Silent error handling
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Clip Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">
                      {clip.title}
                    </h3>
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      #{clip.clipNumber || clip.clip_number || index + 1}
                    </span>
                  </div>

                  {/* Viral Score */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Viral Score</span>
                      <span className="text-sm font-bold text-purple-600">
                        {Number(clip.viral_score || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                        style={{ width: `${Number(clip.viral_score || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={getVideoUrl(clip.clipUrl || clip.file_path)}
                      download={`clip-${index + 1}.mp4`}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg text-center font-semibold hover:shadow-lg transition text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        const url = getVideoUrl(clip.clipUrl || clip.file_path);
                        if (!url) return;
                        
                        fetch(url)
                          .then(response => response.blob())
                          .then(blob => {
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = `clip-${index + 1}.mp4`;
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
                    >
                      ⬇️ Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {loadingActivity ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.slice(0, 10).map((activity, index) => {
                // Determine the link based on activity type
                const activityLink = activity.type === 'video' 
                  ? `/dashboard/videos/${activity.id}` 
                  : `/dashboard/clips`;
                
                // Check if activity has valid thumbnail URL
                const hasThumbnail = (activity.thumbnailUrl || activity.thumbnail_cloud_url) && 
                                    (activity.thumbnailUrl?.startsWith('http') || activity.thumbnail_cloud_url?.startsWith('http'));
                
                return (
                  <Link
                    key={`${activity.type}-${activity.id}-${index}`}
                    to={activityLink}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    {/* Thumbnail or Icon */}
                    {hasThumbnail ? (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-black border-2 border-purple-200 relative group">
                        <img 
                          src={activity.thumbnailUrl || activity.thumbnail_cloud_url}
                          alt={activity.title || 'Video thumbnail'}
                          className="w-full h-full object-cover brightness-90 group-hover:brightness-110 transition-all"
                          loading="lazy"
                          onLoad={() => {
                            // Thumbnail loaded successfully
                          }}
                          onError={(e) => {
                            // Hide broken image and show icon instead
                            e.target.style.display = 'none';
                            const iconDiv = document.createElement('div');
                            iconDiv.className = `w-full h-full flex items-center justify-center text-2xl bg-${activity.color}-100`;
                            iconDiv.textContent = activity.icon;
                            e.target.parentElement.appendChild(iconDiv);
                          }}
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all">
                          <div className="w-8 h-8 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-2xl flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-lg bg-${activity.color}-100 border-2 border-gray-300`}>
                        {activity.icon}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                        {activity.viralScore && (
                          <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                            🔥 {activity.viralScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm font-medium text-gray-900">No recent activity</p>
                <p className="text-xs text-gray-500 mt-1">Get started by uploading your first video</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format timestamps
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const past = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(past.getTime())) {
    return 'Unknown';
  }
  
  const diffInSeconds = Math.floor((now - past) / 1000);

  // Handle future dates (clock skew)
  if (diffInSeconds < 0) {
    return 'Just now';
  }

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export default DashboardOverview;
