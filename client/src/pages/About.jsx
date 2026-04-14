import { useState, useEffect } from 'react';

function About() {
  const [hoveredValue, setHoveredValue] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-16 md:py-24 overflow-hidden">
        {/* Simplified background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-6 px-4 py-2 bg-purple-100 rounded-full">
              <span className="text-purple-700 font-semibold text-sm uppercase tracking-wide">🎬 AI-Powered Video Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              About <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">ClipForge AI</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Transform long-form videos into viral-ready clips automatically using AI, then publish directly to Instagram, TikTok, YouTube Shorts, and more
            </p>
            
            {/* Stats Bar */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { value: '10K+', label: 'Videos Processed' },
                { value: '50K+', label: 'Clips Generated' },
                { value: '5M+', label: 'Hours Saved' },
                { value: '98%', label: 'Satisfaction Rate' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-md">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-orange-100 rounded-full">
              <span className="text-orange-700 font-semibold text-xs uppercase tracking-wide">Our Story</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why We Built ClipForge AI
            </h2>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 md:p-12 border-2 border-orange-200">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                In early 2024, our founder Dipendra was spending 8+ hours every week manually editing his podcast episodes into short clips for social media. 
                He'd watch hours of footage, identify interesting moments, cut them manually, add subtitles one by one, and then upload to each platform separately. 
                It was exhausting, time-consuming, and took away from what he loved most: creating content.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                One day, after missing a viral moment because he didn't have time to clip it, he thought: <span className="font-semibold text-gray-900">"What if AI could do this automatically?"</span> 
                That question sparked ClipForge AI.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                We assembled a team of passionate developers who shared the same frustration. Together, we built ClipForge AI to solve a problem we personally experienced: 
                <span className="font-semibold text-gray-900"> making video content creation accessible, fast, and intelligent</span>.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Today, ClipForge AI helps over 10,000 creators save millions of hours, allowing them to focus on what matters: <span className="font-semibold text-gray-900">creating amazing content and connecting with their audience</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-red-100 rounded-full">
              <span className="text-red-700 font-semibold text-xs uppercase tracking-wide">The Problem</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Content Creation is <span className="text-red-600">Time-Consuming</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            {/* Problem Side */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl md:rounded-3xl p-6 md:p-10 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Without ClipForge</h3>
              </div>
              <ul className="space-y-3 md:space-y-4">
                {[
                  'Spend 5+ hours manually editing one video',
                  'Miss viral moments in long-form content',
                  'Struggle with subtitle generation',
                  'Manually post to each platform separately',
                  'No data on which clips will perform best'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm md:text-base text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution Side */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl md:rounded-3xl p-6 md:p-10 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">With ClipForge AI</h3>
              </div>
              <ul className="space-y-3 md:space-y-4">
                {[
                  'Generate clips in 5 minutes with AI',
                  'AI identifies viral moments automatically',
                  'Auto-generate multi-language subtitles',
                  'Publish to all platforms with one click',
                  'Get viral scores for each clip (0-100%)'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm md:text-base text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-purple-100 rounded-full">
              <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How ClipForge AI Works
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              From upload to viral clips in just 4 simple steps
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '1',
                title: 'Upload Video',
                desc: 'Upload your video or paste a YouTube/Vimeo URL. Supports MP4, MOV, AVI, MKV up to 500MB',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '2',
                title: 'AI Analysis',
                desc: 'Gemini AI analyzes your video for viral moments, emotions, and engagement patterns',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '3',
                title: 'Generate Clips',
                desc: 'AI creates clips with burned-in subtitles, viral scores, and emotion tags automatically',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                color: 'from-indigo-500 to-purple-500'
              },
              {
                step: '4',
                title: 'Publish Everywhere',
                desc: 'Post to Instagram, TikTok, YouTube, Facebook, and Twitter with one click or schedule for later',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />,
                color: 'from-green-500 to-emerald-500'
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                onMouseEnter={() => setActiveStep(idx)}
                className={`relative group transition-all duration-300 ${activeStep === idx ? 'scale-105' : ''}`}
              >
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100">
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mb-3 md:mb-4 mx-auto`}>
                    <span className="text-white font-bold text-base md:text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center text-sm leading-relaxed">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-purple-100 rounded-full">
              <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Go Viral
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by cutting-edge AI technology
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                title: 'Gemini AI Analysis',
                desc: 'Advanced AI identifies viral moments, engagement patterns, and optimal clip points',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />,
                title: 'Whisper AI Subtitles',
                desc: 'Auto-generate accurate subtitles in 50+ languages with automatic language detection',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
                title: 'Viral Score (0-100%)',
                desc: 'Each clip gets a viral potential score based on emotion, pacing, and engagement factors',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                title: 'Emotion Detection',
                desc: 'AI identifies joy, excitement, surprise, tension, and inspiration in your content',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                title: 'Scheduled Publishing',
                desc: 'Schedule clips for optimal posting times across all platforms',
                color: 'from-indigo-500 to-purple-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                title: 'Analytics Dashboard',
                desc: 'Track views, likes, comments, and engagement across all platforms in real-time',
                color: 'from-pink-500 to-rose-500'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-purple-100 rounded-full">
              <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">Who Uses ClipForge</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Every Creator
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                title: 'YouTubers',
                desc: 'Repurpose long videos into shorts for TikTok, Instagram Reels, and YouTube Shorts',
                example: 'Example: Turn a 30-min tutorial into 10 viral shorts',
                color: 'from-red-500 to-pink-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
                title: 'Podcasters',
                desc: 'Create audiograms and video snippets from podcast episodes for social promotion',
                example: 'Example: Extract 5 best moments from each episode',
                color: 'from-purple-500 to-indigo-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                title: 'Marketers',
                desc: 'Scale content production and maximize ROI from video marketing campaigns',
                example: 'Example: Create 20 ads from one product demo',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
                title: 'Educators',
                desc: 'Create bite-sized lesson snippets and educational content for students',
                example: 'Example: Break lectures into digestible 60-sec clips',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((useCase, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${useCase.color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {useCase.icon}
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{useCase.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3">{useCase.desc}</p>
                <p className="text-xs md:text-sm text-purple-600 font-semibold">{useCase.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-purple-100 rounded-full">
              <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">The Team</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">Meet the Team Behind ClipForge</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              A passionate team of developers and innovators building the future of content creation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 max-w-6xl mx-auto">
            {[
              { 
                initials: 'DK', 
                name: 'Dipendra Kumar', 
                role: 'Founder & Backend Developer', 
                bio: 'Backend architect and founder who built ClipForge from scratch. Specializes in scalable systems, video processing pipelines, and AI integration.',
                skills: 'Node.js, Python, PostgreSQL, AWS, AI APIs',
                color: 'from-purple-500 to-pink-500'
              },
              { 
                initials: 'TQ', 
                name: 'Tanisqa Raj', 
                role: 'Frontend Developer', 
                bio: 'UI/UX specialist focused on creating intuitive, accessible interfaces. Ensures every user interaction is seamless and delightful.',
                skills: 'React, Tailwind CSS, JavaScript, UX Design',
                color: 'from-indigo-500 to-purple-500'
              },
              { 
                initials: 'AJ', 
                name: 'Amarjeet Kumar', 
                role: 'Frontend Developer', 
                bio: 'Frontend engineer building responsive, performant user interfaces. Crafts pixel-perfect designs and smooth user experiences.',
                skills: 'React, Vite, Tailwind CSS, JavaScript',
                color: 'from-blue-500 to-indigo-500'
              },
              { 
                initials: 'AN', 
                name: 'Anurag Kumar', 
                role: 'Backend Developer', 
                bio: 'Backend developer specializing in API development and database optimization. Ensures robust, secure server-side operations.',
                skills: 'Node.js, Express, PostgreSQL, Python',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((member, idx) => (
              <div key={idx} className="group text-center">
                <div className="relative mb-6 inline-block">
                  <div className={`w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br ${member.color} rounded-full mx-auto flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105`}>
                    <span className="text-white text-3xl md:text-4xl font-bold">{member.initials}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{member.name}</h3>
                <p className="text-purple-600 font-semibold mb-3">{member.role}</p>
                <p className="text-sm md:text-base text-gray-600 mb-3 leading-relaxed">{member.bio}</p>
                <p className="text-xs md:text-sm text-gray-500 italic">{member.skills}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 md:mt-16 text-center">
            <p className="text-gray-600 mb-6 text-base md:text-lg">Interested in joining our mission?</p>
            <a href="/contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <span>Get in Touch</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values Combined */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full">
              <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">Our Purpose</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-lg md:text-xl text-gray-600">Our mission, vision, and core values</p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto mb-12">
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-purple-200">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
                To democratize video content creation by empowering <span className="font-semibold text-purple-600">1 million creators by 2027</span> with AI-powered tools that transform hours of editing into minutes of automation.
              </p>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                We believe every creator—from students to entrepreneurs—deserves access to professional-grade video editing, regardless of technical expertise or budget. ClipForge AI makes this possible.
              </p>
            </div>

            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-indigo-200">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
                To become the <span className="font-semibold text-indigo-600">#1 AI-powered video platform by 2030</span>, processing 10M+ videos monthly and revolutionizing how content is created, distributed, and consumed globally.
              </p>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                We envision a future where AI handles the technical complexity of video editing, enabling creators to focus purely on storytelling and audience connection—helping them collectively earn <span className="font-semibold text-indigo-600">$1B+ in revenue</span> through optimized content distribution.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { 
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  title: 'Quality First',
                  desc: '99.9% uptime, 95%+ AI accuracy, zero compromises',
                  color: 'from-purple-500 to-pink-500'
                },
                { 
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                  title: 'Innovation',
                  desc: 'Weekly updates, new AI models, cutting-edge features',
                  color: 'from-indigo-500 to-purple-500'
                },
                { 
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
                  title: 'Creator-Focused',
                  desc: 'Every feature built from real creator feedback',
                  color: 'from-blue-500 to-indigo-500'
                },
                { 
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  title: 'Speed & Efficiency',
                  desc: '5-min processing, 10x faster than manual editing',
                  color: 'from-teal-500 to-blue-500'
                }
              ].map((value, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={() => setHoveredValue(idx)}
                  onMouseLeave={() => setHoveredValue(null)}
                  className="group relative"
                >
                  <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 h-full ${hoveredValue === idx ? 'transform -translate-y-3' : ''}`}>
                    <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${value.color} rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {value.icon}
                      </svg>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 text-center">{value.title}</h3>
                    <p className="text-sm md:text-base text-gray-600 text-center leading-relaxed">{value.desc}</p>
                    
                    {hoveredValue === idx && (
                      <div className="absolute inset-0 border-2 border-purple-400 rounded-2xl pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SDG / Impact Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-blue-100 rounded-full">
              <span className="text-blue-700 font-semibold text-xs uppercase tracking-wide">Social Impact</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contributing to UN Sustainable Development Goals
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Building technology that creates positive social and environmental impact
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {[
              {
                sdg: 'SDG 4',
                emoji: '🎓',
                title: 'Quality Education',
                desc: 'Democratizes educational content creation by enabling educators to convert lectures into micro-learning clips with multi-language subtitles, making quality education accessible globally at 90% lower cost than traditional editing.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
                color: 'from-blue-500 to-cyan-500'
              },
              {
                sdg: 'SDG 8',
                emoji: '💼',
                title: 'Decent Work & Economic Growth',
                desc: 'Empowers the creator economy and small businesses by automating video production, enabling entrepreneurs to produce 5-10x more content and compete in the $250B+ digital content market without expensive resources.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                color: 'from-red-500 to-pink-500'
              },
              {
                sdg: 'SDG 9',
                emoji: '🏗️',
                title: 'Industry, Innovation & Infrastructure',
                desc: 'Advances AI application through integration of cutting-edge technologies (Gemini AI, Whisper AI, FFmpeg) in an open-source architecture, making enterprise-grade AI accessible to individuals and small organizations worldwide.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                color: 'from-orange-500 to-amber-500'
              },
              {
                sdg: 'SDG 17',
                emoji: '🤝',
                title: 'Partnerships for the Goals',
                desc: 'Fosters global collaboration through multi-platform integration (Instagram, TikTok, YouTube, Facebook, Twitter/X), multi-language support, and API-first design that enables partnerships with educational institutions, NGOs, and content platforms.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
                color: 'from-purple-500 to-indigo-500'
              }
            ].map((sdg, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${sdg.color} rounded-2xl flex items-center justify-center`}>
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {sdg.icon}
                    </svg>
                  </div>
                  <span className="text-3xl md:text-4xl">{sdg.emoji}</span>
                </div>
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 bg-gradient-to-r ${sdg.color} text-white text-xs font-bold rounded-full`}>
                    {sdg.sdg}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{sdg.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{sdg.desc}</p>
              </div>
            ))}
          </div>

          {/* Environmental Commitment */}
          <div className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-10 border-2 border-green-200 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Environmental Responsibility</h3>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                  We're committed to reducing our carbon footprint through optimized cloud infrastructure, efficient video processing algorithms, 
                  and partnering with carbon-neutral hosting providers.
                </p>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>50% reduction in processing energy through AI optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Carbon-neutral cloud hosting with AWS renewable energy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Accessibility-first design supporting screen readers and keyboard navigation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-purple-100 rounded-full">
              <span className="text-purple-700 font-semibold text-xs uppercase tracking-wide">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Quick answers to common questions about ClipForge AI
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'How long does it take to process a video?',
                answer: 'Most videos are processed in 3-7 minutes depending on length. A 30-minute video typically takes 5 minutes to analyze and generate clips.'
              },
              {
                question: 'What video formats do you support?',
                answer: 'We support MP4, MOV, AVI, MKV, and WebM formats. You can also paste YouTube, Vimeo, or direct video URLs. Maximum file size is 500MB for uploads.'
              },
              {
                question: 'How accurate are the AI-generated clips?',
                answer: 'Our Gemini AI has 95%+ accuracy in identifying viral moments. Each clip includes a viral score (0-100%) to help you choose the best content. You can always preview and edit before publishing.'
              },
              {
                question: 'Can I edit clips before publishing?',
                answer: 'Yes! You can trim clips, adjust subtitles, change aspect ratios (9:16, 1:1, 16:9), add custom captions, and preview everything before publishing to social platforms.'
              },
              {
                question: 'Which platforms can I publish to?',
                answer: 'Currently: Instagram (Reels, Feed, Stories), TikTok, YouTube (Shorts, Regular), Facebook (Reels, Feed), and Twitter. More platforms coming soon!'
              },
              {
                question: 'Do you offer a free plan?',
                answer: 'Yes! Our free plan includes 3 videos per month with up to 10 clips per video. Perfect for trying out ClipForge AI. Upgrade anytime for unlimited processing.'
              },
              {
                question: 'How do subtitles work?',
                answer: 'We use Whisper AI for automatic subtitle generation in 50+ languages with 98% accuracy. Subtitles are burned into the video and fully customizable (font, color, position, style).'
              },
              {
                question: 'Is my content secure and private?',
                answer: 'Absolutely. All videos are encrypted in transit and at rest. We never share your content with third parties. You can delete videos anytime, and they\'re permanently removed from our servers.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 md:px-8 py-4 md:py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base md:text-lg font-bold text-gray-900 pr-4">{faq.question}</span>
                  <svg 
                    className={`w-6 h-6 text-purple-600 flex-shrink-0 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 md:px-8 pb-4 md:pb-6">
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <a href="/contact" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
              Contact our support team →
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 opacity-5"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full -ml-24 md:-ml-32 -mb-24 md:-mb-32"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                Join Us on This Journey
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-purple-100 mb-8 md:mb-10 max-w-2xl mx-auto">
                Be part of the content creation revolution and transform how you create
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a 
                  href="/signup" 
                  className="group bg-white text-purple-600 px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg font-bold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 w-full sm:w-auto justify-center"
                >
                  <span>Get Started Free</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a 
                  href="/contact" 
                  className="group bg-transparent text-white px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg font-bold border-2 border-white hover:bg-white hover:text-purple-600 transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 w-full sm:w-auto justify-center"
                >
                  <span>Contact Us</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </a>
              </div>

              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-purple-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="Back to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default About;
