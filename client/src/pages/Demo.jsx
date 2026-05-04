import { useState } from 'react';
import toast from '../utils/toast';

function Demo() {
  const [activeTab, setActiveTab] = useState('upload');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [demoVideo, setDemoVideo] = useState(null);
  const [videoId, setVideoId] = useState(null); // Store video ID for YouTube downloads
  const [generatedClips, setGeneratedClips] = useState([]); // Store generated clips
  const [showClips, setShowClips] = useState(false); // Show clips section
  const [fastMode, setFastMode] = useState(true); // Fast mode (skip subtitles) - default ON
  const [showAdvanced, setShowAdvanced] = useState(false); // Show advanced options
  const [clipDuration, setClipDuration] = useState(60); // Clip duration in seconds (default 1 minute)
  const [numClips, setNumClips] = useState(5); // Number of clips to generate
  
  // New advanced options
  const [clipMode, setClipMode] = useState('ai'); // 'ai', 'divide', or 'range'
  const [startMinutes, setStartMinutes] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endMinutes, setEndMinutes] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [divideMinutes, setDivideMinutes] = useState(0);
  const [divideSeconds, setDivideSeconds] = useState(45);
  const [videoQuality, setVideoQuality] = useState('720p'); // Video quality option
  const [subtitleLanguage, setSubtitleLanguage] = useState('auto'); // Subtitle language
  
  // Progress tracking
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

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
      handleVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoFile(e.target.files[0]);
    }
  };

  const handleVideoFile = (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
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
    
    // Store all intervals so we can clear them in finally block
    let downloadProgressInterval = null;
    let analysisProgressInterval = null;
    let clipProgressInterval = null;
    let progressPollInterval = null;
    
    // Simulate download progress (0% to 25% over ~30 seconds)
    downloadProgressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev < 25) return prev + 1;
        return prev;
      });
    }, 1200); // Update every 1.2 seconds
    
    try {
      // Step 1: Download video
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
        // Handle specific error cases
        if (downloadResponse.status === 403) {
          toast.error('⚠️ YouTube bot detection triggered');
          if (downloadData.solutions) {
            console.log('Solutions:', downloadData.solutions);
            toast.info('💡 Try a different video or check console for solutions');
          }
        } else if (downloadResponse.status === 404) {
          toast.error('❌ Video unavailable or private');
        } else if (downloadResponse.status === 429) {
          toast.error('⚠️ Rate limited by YouTube');
          if (downloadData.tip) {
            toast.info(downloadData.tip);
          }
        } else {
          toast.error(`Error: ${downloadData.error || 'Failed to download video'}`);
        }
        return;
      }

      const subtitleMsg = downloadData.hasSubtitles ? ' with subtitles' : ' (subtitles unavailable)';
      toast.success(`✅ Video downloaded${subtitleMsg}: ${downloadData.title || 'Success'}`);
      
      setProcessingStep('Video downloaded successfully');
      setProcessingProgress(30);
      
      // Extract video ID from URL
      const urlParts = downloadData.videoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const extractedVideoId = filename.replace('.mp4', '');
      
      // Set the downloaded video for preview
      setDemoVideo(downloadData.videoUrl);
      setVideoId(extractedVideoId);
      
      // Step 2: Automatically process video with AI
      setProcessingStep('AI analyzing video and detecting viral moments...');
      setProcessingProgress(35);
      toast.info('🤖 AI is analyzing your video and generating clips...');
      
      // Simulate analysis progress (35% to 60%)
      analysisProgressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 60) return prev + 1;
          return prev;
        });
      }, 800);
      
      // Get user ID if logged in
      const token = localStorage.getItem('token');
      let userId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch {
          console.log('Not logged in or invalid token');
        }
      }
      
      // Prepare processing options based on clip mode
      const processingOptions = {
        videoId: extractedVideoId,
        userId: userId,
        skipSubtitles: fastMode,
        clipMode: clipMode,
        numClips: numClips,
        quality: videoQuality,
        subtitleLanguage: subtitleLanguage !== 'auto' ? subtitleLanguage : null
      };
      
      // Add mode-specific options
      if (clipMode === 'ai') {
        processingOptions.clipDuration = clipDuration;
      } else if (clipMode === 'divide') {
        const divideDuration = divideMinutes * 60 + divideSeconds;
        processingOptions.clipDuration = divideDuration;
        processingOptions.numClips = 0; // Generate as many as possible
        setProcessingStep(`Dividing video into ${divideDuration}s clips...`);
      } else if (clipMode === 'range') {
        const startTime = startMinutes * 60 + startSeconds;
        const endTime = endMinutes * 60 + endSeconds;
        processingOptions.startTime = startTime;
        processingOptions.endTime = endTime;
        processingOptions.clipDuration = clipDuration;
        setProcessingStep(`Processing range ${startTime}s to ${endTime}s...`);
      }
      
      // Clear old simulated progress
      if (analysisProgressInterval) clearInterval(analysisProgressInterval);
      
      // Start polling for progress updates BEFORE making the request
      progressPollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`http://localhost:5001/progress/${extractedVideoId}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.progress > 0) {
              setProcessingProgress(progressData.progress);
              setProcessingStep(progressData.step || 'Processing...');
            }
            
            // Stop polling if complete or failed
            if (progressData.status === 'completed' || progressData.status === 'failed') {
              clearInterval(progressPollInterval);
            }
          }
        } catch (error) {
          console.error('Progress poll error:', error);
        }
      }, 500); // Poll every 500ms
      
      const processResponse = await fetch('http://localhost:5001/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingOptions)
      });

      if (!processResponse.ok) {
        clearInterval(progressPollInterval);
        clearInterval(progressPollInterval);
        const errorData = await processResponse.json();
        toast.error(`Processing failed: ${errorData.error || 'Unknown error'}`);
        return;
      }

      setProcessingStep('Creating video clips with FFmpeg...');
      
      // Don't set progress here, let the backend handle it
      const processData = await processResponse.json();
      
      // Stop polling
      clearInterval(progressPollInterval);
      if (clipProgressInterval) clearInterval(clipProgressInterval);
      
      console.log('✅ Processing complete! Response:', processData);
      console.log('📊 Clips received:', processData.clips);
      console.log('📊 Clips length:', processData.clips?.length || 0);
      
      setProcessingProgress(100);
      setProcessingStep('Complete! 🎉');
      
      // Check if clips exist
      if (!processData.clips || processData.clips.length === 0) {
        toast.warning('⚠️ Processing completed but no clips were generated. This might be due to video length or content.');
        console.warn('No clips generated. Full response:', processData);
        return;
      }
      
      toast.success(`🎉 Success! Generated ${processData.clips.length} viral clips!`);
      
      // Store clips for display (sort by clip number to ensure correct order)
      const sortedClips = [...processData.clips].sort((a, b) => a.clipNumber - b.clipNumber);
      setGeneratedClips(sortedClips);
      setShowClips(true);
      
      console.log('🎬 Clips state updated, showClips:', true);
      console.log('🎬 generatedClips:', sortedClips);
      
      // Display clip information
      if (sortedClips.length > 0) {
        toast.info(`💡 Top clip: "${sortedClips[0].title}" (${sortedClips[0].viralScore.toFixed(2)} viral score)`);
        
        // Scroll to clips section after a short delay
        setTimeout(() => {
          const clipsSection = document.getElementById('clips-section');
          if (clipsSection) {
            clipsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
      
      setYoutubeUrl('');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect to video processing server. Make sure Flask server is running on port 5001.');
    } finally {
      // Clear all intervals
      if (downloadProgressInterval) clearInterval(downloadProgressInterval);
      if (analysisProgressInterval) clearInterval(analysisProgressInterval);
      if (clipProgressInterval) clearInterval(clipProgressInterval);
      if (progressPollInterval) clearInterval(progressPollInterval);
      
      setProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  const processVideo = async () => {
    if (!uploadedFile && !demoVideo) {
      toast.error('Please upload a video first');
      return;
    }

    setProcessing(true);
    setProcessingStep('Preparing video...');
    setProcessingProgress(0);
    
    // Store all intervals
    let uploadProgressInterval = null;
    let analysisProgressInterval = null;
    let clipProgressInterval = null;
    let progressPollInterval = null;
    
    // Simulate upload progress
    uploadProgressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev < 20) return prev + 2;
        return prev;
      });
    }, 500);
    
    try {
      let processVideoId = videoId; // Use stored video ID from YouTube download
      
      // Step 1: Upload video to Flask server (only if it's an uploaded file, not YouTube)
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

      // Step 2: Process video with AI
      setProcessingStep('AI analyzing video and detecting moments...');
      setProcessingProgress(30);
      toast.info('🤖 AI is analyzing your video...');
      
      // Simulate analysis progress
      analysisProgressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 60) return prev + 1;
          return prev;
        });
      }, 700);
      
      // Prepare processing options based on clip mode
      const processingOptions = {
        videoId: processVideoId,
        skipSubtitles: fastMode,
        clipMode: clipMode,
        numClips: numClips,
        quality: videoQuality,
        subtitleLanguage: subtitleLanguage !== 'auto' ? subtitleLanguage : null
      };
      
      // Add mode-specific options
      if (clipMode === 'ai') {
        processingOptions.clipDuration = clipDuration;
      } else if (clipMode === 'divide') {
        const divideDuration = divideMinutes * 60 + divideSeconds;
        processingOptions.clipDuration = divideDuration;
        processingOptions.numClips = 0; // Generate as many as possible
      } else if (clipMode === 'range') {
        const startTime = startMinutes * 60 + startSeconds;
        const endTime = endMinutes * 60 + endSeconds;
        processingOptions.startTime = startTime;
        processingOptions.endTime = endTime;
        processingOptions.clipDuration = clipDuration;
      }
      
      // Clear old simulated progress
      if (analysisProgressInterval) clearInterval(analysisProgressInterval);
      
      // Start polling for progress updates BEFORE making the request
      progressPollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`http://localhost:5001/progress/${processVideoId}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.progress > 0) {
              setProcessingProgress(progressData.progress);
              setProcessingStep(progressData.step || 'Processing...');
            }
            
            // Stop polling if complete or failed
            if (progressData.status === 'completed' || progressData.status === 'failed') {
              clearInterval(progressPollInterval);
            }
          }
        } catch (error) {
          console.error('Progress poll error:', error);
        }
      }, 500); // Poll every 500ms
      
      const processResponse = await fetch('http://localhost:5001/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingOptions)
      });

      if (!processResponse.ok) {
        clearInterval(progressPollInterval);
        clearInterval(progressPollInterval);
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      const processData = await processResponse.json();
      
      // Stop polling
      clearInterval(progressPollInterval);
      if (clipProgressInterval) clearInterval(clipProgressInterval);
      
      console.log('✅ Processing complete! Response:', processData);
      console.log('📊 Clips received:', processData.clips);
      
      setProcessingProgress(100);
      setProcessingStep('Complete! 🎉');
      
      toast.success(`🎉 Success! Generated ${processData.clips.length} viral clips!`);
      
      // Store clips for display (sort by clip number to ensure correct order)
      const sortedClips = [...processData.clips].sort((a, b) => a.clipNumber - b.clipNumber);
      setGeneratedClips(sortedClips);
      setShowClips(true);
      
      console.log('🎬 Clips state updated, showClips:', true);
      
      // You can now display the clips to the user
      if (sortedClips.length > 0) {
        toast.info(`💡 Top clip: "${processData.clips[0].title}" (${processData.clips[0].viralScore.toFixed(2)} viral score)`);
        
        // Scroll to clips section after a short delay
        setTimeout(() => {
          const clipsSection = document.getElementById('clips-section');
          if (clipsSection) {
            clipsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to process video. Make sure Flask server is running on port 5001.');
    } finally {
      // Clear all intervals
      if (uploadProgressInterval) clearInterval(uploadProgressInterval);
      if (analysisProgressInterval) clearInterval(analysisProgressInterval);
      if (clipProgressInterval) clearInterval(clipProgressInterval);
      if (progressPollInterval) clearInterval(progressPollInterval);
      
      setProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            See ClipForge AI in Action
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your video or paste a YouTube link to see how our AI works
          </p>
        </div>

        {/* Demo Video Section - How it Works */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="aspect-video bg-black">
              {/* Local Demo Video - Fixed, cannot be changed by users */}
              <video 
                className="w-full h-full" 
                controls
                poster="/Clipforge ai.png"
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
                <source src="/clipforge_ai.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    🎬 Watch How ClipForge AI Works
                  </h3>
                  <p className="text-gray-600">
                    See how our AI analyzes your video, detects emotions, and generates viral-ready clips in minutes
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    Official Demo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Process a 1-hour video in under 5 minutes with our optimized AI pipeline
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">95% Accuracy</h3>
            <p className="text-gray-600">
              Our emotion detection AI identifies viral moments with industry-leading precision
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Save 10+ Hours</h3>
            <p className="text-gray-600">
              Automate what used to take hours of manual editing into minutes
            </p>
          </div>
        </div>

        {/* Try It Yourself Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            🚀 Try It Yourself (Test Mode)
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Upload your own video or paste a YouTube link to test the platform
          </p>
          
          <div className="max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex justify-center space-x-4 mb-8 border-b">
              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-3 px-6 font-medium transition ${
                  activeTab === 'upload'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📤 Upload Video
              </button>
              <button
                onClick={() => setActiveTab('youtube')}
                className={`pb-3 px-6 font-medium transition ${
                  activeTab === 'youtube'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔗 YouTube Link
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
                                  ⏱️ Clip Duration: {clipDuration >= 60 ? `${Math.floor(clipDuration / 60)}min ${clipDuration % 60 > 0 ? `${clipDuration % 60}sec` : ""}` : `${clipDuration}sec`}
                                </label>
                                <input
                                  type="range"
                                  min="30"
                                  max="300"
                                  step="30"
                                  value={clipDuration}
                                  onChange={(e) => setClipDuration(parseInt(e.target.value))}
                                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-600 mt-1">
                                  <span>30s</span>
                                  <span>1m</span>
                                  <span>1m30s</span>
                                  <span>2m</span>
                                  <span>2m30s</span>
                                  <span>3m</span>
                                  <span>3m30s</span>
                                  <span>4m</span>
                                  <span>4m30s</span>
                                  <span>5m</span>
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
                                  <span>2</span>
                                  <span>3</span>
                                  <span>4</span>
                                  <span>5</span>
                                  <span>6</span>
                                  <span>7</span>
                                  <span>8</span>
                                  <span>9</span>
                                  <span>10</span>
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
                                  ⏱️ Clip Duration: {clipDuration >= 60 ? `${Math.floor(clipDuration / 60)}min ${clipDuration % 60 > 0 ? `${clipDuration % 60}sec` : ""}` : `${clipDuration}sec`}
                                </label>
                                <input
                                  type="range"
                                  min="30"
                                  max="300"
                                  step="30"
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
                              <div className="flex justify-between text-xs text-gray-600 mt-1">
                                  <span>1</span>
                                  <span>2</span>
                                  <span>3</span>
                                  <span>4</span>
                                  <span>5</span>
                                  <span>6</span>
                                  <span>7</span>
                                  <span>8</span>
                                  <span>9</span>
                                  <span>10</span>
                                </div>
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

                    {/* Progress Indicator for Upload */}
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
                      onClick={processVideo}
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
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      Upload Your Video
                    </h3>
                    <p className="text-gray-500 mb-6">Drag & drop your video here or click to browse</p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      <span className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg cursor-pointer inline-block transition">
                        Browse Files
                      </span>
                    </label>
                    <p className="text-sm text-gray-400 mt-6">
                      Supported formats: MP4, MOV, AVI, MKV • Max size: 500MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Tab */}
            {activeTab === 'youtube' && (
              <div className="max-w-2xl mx-auto">
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
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 mb-4">
                      <div className="flex items-start">
                        <div className="text-3xl mr-3">✅</div>
                        <div>
                          <p className="text-lg font-semibold text-green-900 mb-1">
                            Processing Complete!
                          </p>
                          <p className="text-sm text-green-700">
                            Your video has been downloaded and analyzed. Check the browser console (F12) to see all generated clips and their URLs.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDemoVideo(null);
                        setYoutubeUrl('');
                        setVideoId(null);
                        setGeneratedClips([]);
                        setShowClips(false);
                      }}
                      className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition border-2 border-red-200 font-semibold"
                    >
                      ✕ Process Another Video
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">🔗</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Paste Video URL
                      </h3>
                      <p className="text-gray-500">
                        We'll download and process the video for you
                      </p>
                      <p className="text-xs text-purple-600 mt-2">
                        ✨ Supports YouTube, Instagram, Facebook, TikTok, Twitter, Vimeo & 1000+ sites
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

                    {/* Advanced Options */}
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
                                  ⏱️ Clip Duration: {clipDuration >= 60 ? `${Math.floor(clipDuration / 60)}min ${clipDuration % 60 > 0 ? `${clipDuration % 60}sec` : ""}` : `${clipDuration}sec`}
                                </label>
                                <input
                                  type="range"
                                  min="30"
                                  max="300"
                                  step="30"
                                  value={clipDuration}
                                  onChange={(e) => setClipDuration(parseInt(e.target.value))}
                                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-600 mt-1">
                                  <span>30s</span>
                                  <span>1m</span>
                                  <span>1m30s</span>
                                  <span>2m</span>
                                  <span>2m30s</span>
                                  <span>3m</span>
                                  <span>3m30s</span>
                                  <span>4m</span>
                                  <span>4m30s</span>
                                  <span>5m</span>
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
                                  <span>2</span>
                                  <span>3</span>
                                  <span>4</span>
                                  <span>5</span>
                                  <span>6</span>
                                  <span>7</span>
                                  <span>8</span>
                                  <span>9</span>
                                  <span>10</span>
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
                                💡 Total: {divideMinutes}m {divideSeconds}s per clip • Video will be divided into equal parts
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
                                  ⏱️ Clip Duration: {clipDuration >= 60 ? `${Math.floor(clipDuration / 60)}min ${clipDuration % 60 > 0 ? `${clipDuration % 60}sec` : ""}` : `${clipDuration}sec`}
                                </label>
                                <input
                                  type="range"
                                  min="30"
                                  max="300"
                                  step="30"
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
                              <div className="flex justify-between text-xs text-gray-600 mt-1">
                                  <span>1</span>
                                  <span>2</span>
                                  <span>3</span>
                                  <span>4</span>
                                  <span>5</span>
                                  <span>6</span>
                                  <span>7</span>
                                  <span>8</span>
                                  <span>9</span>
                                  <span>10</span>
                                </div>
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
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleYoutubeSubmit} className="space-y-4">
                      <input
                        type="url"
                        required
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or any video URL"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                        disabled={processing}
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
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Processing time depends on video length. A 10-minute video typically takes 2-3 minutes to process.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 text-center mt-8">
            💡 This is a test mode • No credit card required • Sign up for full features
          </p>
        </div>

        {/* Generated Clips Section */}
        {showClips && generatedClips.length > 0 && (
          <div id="clips-section" className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎬 Your Viral Clips Are Ready!
              </h2>
              <p className="text-gray-600">
                {generatedClips.length} clips generated • Click to preview and download
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedClips.map((clip, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1">
                  {/* Video Preview */}
                  <div className="aspect-video bg-black">
                    <video 
                      id={`clip-video-${index}`}
                      src={clip.clipUrl} 
                      controls 
                      className="w-full h-full"
                      poster={clip.thumbnailUrl}
                      onPlay={(e) => {
                        // Pause all other videos when this one plays
                        const currentVideo = e.currentTarget;
                        const allVideos = document.querySelectorAll('video');
                        allVideos.forEach((video) => {
                          if (video !== currentVideo && !video.paused) {
                            video.pause();
                          }
                        });
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
                        #{index + 1}
                      </span>
                    </div>

                    {/* Viral Score */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Viral Score</span>
                        <span className="text-sm font-bold text-purple-600">
                          {clip.viralScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${clip.viralScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Emotion & Duration */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {clip.emotion}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {clip.duration}s
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {Math.floor(clip.startTime)}s - {Math.floor(clip.endTime)}s
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {clip.reason}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <a
                        href={clip.clipUrl}
                        download={`clip-${index + 1}-${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg text-center font-semibold hover:shadow-lg transition text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          // Use fetch to download the file
                          fetch(clip.clipUrl)
                            .then(response => response.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `clip-${index + 1}-${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              toast.success('Downloading clip...');
                            })
                            .catch(error => {
                              console.error('Download error:', error);
                              toast.error('Failed to download clip');
                            });
                        }}
                      >
                        ⬇️ Download
                      </a>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            // Use native share API if available
                            navigator.share({
                              title: clip.title,
                              text: `Check out this viral clip: ${clip.title}`,
                              url: clip.clipUrl
                            }).then(() => {
                              toast.success('Shared successfully!');
                            }).catch((error) => {
                              if (error.name !== 'AbortError') {
                                console.error('Share error:', error);
                                // Fallback to copy URL
                                navigator.clipboard.writeText(clip.clipUrl);
                                toast.success('Clip URL copied to clipboard!');
                              }
                            });
                          } else {
                            // Fallback: copy to clipboard
                            navigator.clipboard.writeText(clip.clipUrl);
                            toast.success('Clip URL copied to clipboard!');
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-semibold"
                        title="Share Clip"
                      >
                        📤
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(clip.clipUrl);
                          toast.success('Clip URL copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-semibold"
                        title="Copy URL"
                      >
                        🔗
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download All Button */}
            <div className="mt-8 text-center">
              <button
                onClick={async () => {
                  toast.info('Starting download of all clips...');
                  
                  for (let i = 0; i < generatedClips.length; i++) {
                    const clip = generatedClips[i];
                    try {
                      // Wait a bit between downloads to avoid overwhelming the browser
                      if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                      }
                      
                      const response = await fetch(clip.clipUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `clip-${i + 1}-${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      
                      toast.success(`Downloaded clip ${i + 1}/${generatedClips.length}`);
                    } catch (error) {
                      console.error(`Error downloading clip ${i + 1}:`, error);
                      toast.error(`Failed to download clip ${i + 1}`);
                    }
                  }
                  
                  toast.success('All clips downloaded!');
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-8 rounded-lg font-semibold hover:shadow-xl transition transform hover:-translate-y-1"
              >
                ⬇️ Download All Clips ({generatedClips.length})
              </button>
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What Creators Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Dipendra Kumar</p>
                  <p className="text-sm text-gray-600">Content Creator</p>
                </div>
              </div>
              <p className="text-gray-600">
                "ClipForge AI has completely transformed my workflow. What used to take me 3 hours now takes 10 minutes!"
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Sarah Miller</p>
                  <p className="text-sm text-gray-600">YouTuber</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The AI is incredibly accurate at finding the best moments. My engagement has increased by 300%!"
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  MJ
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Mike Johnson</p>
                  <p className="text-sm text-gray-600">Digital Marketer</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Best investment for my content strategy. The ROI is incredible and the quality is top-notch."
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of creators already using ClipForge AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-xl transition transform hover:-translate-y-1">
              Start Free Trial
            </a>
            <a href="/pricing" className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-gray-200 hover:border-purple-600 transition">
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo;







