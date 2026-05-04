function AdvancedOptions({
  showAdvanced,
  setShowAdvanced,
  clipMode,
  setClipMode,
  clipDuration,
  setClipDuration,
  numClips,
  setNumClips,
  divideMinutes,
  setDivideMinutes,
  divideSeconds,
  setDivideSeconds,
  startMinutes,
  setStartMinutes,
  startSeconds,
  setStartSeconds,
  endMinutes,
  setEndMinutes,
  endSeconds,
  setEndSeconds,
  videoQuality,
  setVideoQuality,
  subtitleLanguage,
  setSubtitleLanguage,
  fastMode,
  setFastMode,
  radioNameSuffix = ''
}) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      >
        <span className="font-semibold text-gray-900">⚙️ Advanced Options</span>
        <span className="text-gray-600">{showAdvanced ? '▲' : '▼'}</span>
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
                  name={`clipMode${radioNameSuffix}`}
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
                  name={`clipMode${radioNameSuffix}`}
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
                  name={`clipMode${radioNameSuffix}`}
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
                  ⏱️ Clip Duration: {clipDuration >= 60 ? `${Math.floor(clipDuration / 60)}min ${clipDuration % 60 > 0 ? `${clipDuration % 60}sec` : ''}` : `${clipDuration}sec`}
                </label>
                <div className="relative" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                  {/* Background unfilled bar */}
                  <div className="absolute left-0 w-full h-2 bg-gray-300 rounded-lg pointer-events-none" style={{ top: 'calc(50% + 2px)', transform: 'translateY(-50%)' }}></div>
                  {/* Progress fill bar */}
                  <div className="absolute left-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-l-lg pointer-events-none transition-all duration-200"
                    style={{ 
                      width: `${((clipDuration - 30) / (300 - 30)) * 100}%`,
                      top: 'calc(50% + 2px)',
                      transform: 'translateY(-50%)'
                    }}
                  ></div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="30"
                    value={clipDuration}
                    onChange={(e) => setClipDuration(parseInt(e.target.value))}
                    className="w-full bg-transparent rounded-lg appearance-none cursor-pointer relative"
                    style={{ margin: 0, padding: 0, height: '24px' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>30s</span>
                  <span className="hidden sm:inline">1m</span>
                  <span className="hidden md:inline">1m30s</span>
                  <span className="hidden sm:inline">2m</span>
                  <span className="hidden md:inline">2m30s</span>
                  <span className="hidden sm:inline">3m</span>
                  <span className="hidden md:inline">3m30s</span>
                  <span className="hidden sm:inline">4m</span>
                  <span className="hidden md:inline">4m30s</span>
                  <span>5m</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🎬 Number of Clips: {numClips}
                </label>
                <div className="relative" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                  {/* Background unfilled bar */}
                  <div className="absolute left-0 w-full h-2 bg-gray-300 rounded-lg pointer-events-none" style={{ top: 'calc(50% + 2px)', transform: 'translateY(-50%)' }}></div>
                  {/* Progress fill bar */}
                  <div className="absolute left-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-l-lg pointer-events-none transition-all duration-200"
                    style={{ 
                      width: `${((numClips - 1) / (10 - 1)) * 100}%`,
                      top: 'calc(50% + 2px)',
                      transform: 'translateY(-50%)'
                    }}
                  ></div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={numClips}
                    onChange={(e) => setNumClips(parseInt(e.target.value))}
                    className="w-full bg-transparent rounded-lg appearance-none cursor-pointer relative"
                    style={{ margin: 0, padding: 0, height: '24px' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1</span>
                  <span className="hidden sm:inline">2</span>
                  <span className="hidden md:inline">3</span>
                  <span className="hidden sm:inline">4</span>
                  <span className="hidden md:inline">5</span>
                  <span className="hidden sm:inline">6</span>
                  <span className="hidden md:inline">7</span>
                  <span className="hidden sm:inline">8</span>
                  <span className="hidden md:inline">9</span>
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
                  ⏱️ Clip Duration: {clipDuration >= 60 ? `${Math.floor(clipDuration / 60)}min ${clipDuration % 60 > 0 ? `${clipDuration % 60}sec` : ''}` : `${clipDuration}sec`}
                </label>
                <div className="relative" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                  {/* Background unfilled bar */}
                  <div className="absolute left-0 w-full h-2 bg-gray-300 rounded-lg pointer-events-none" style={{ top: 'calc(50% + 2px)', transform: 'translateY(-50%)' }}></div>
                  {/* Progress fill bar */}
                  <div className="absolute left-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-l-lg pointer-events-none transition-all duration-200"
                    style={{ 
                      width: `${((clipDuration - 30) / (300 - 30)) * 100}%`,
                      top: 'calc(50% + 2px)',
                      transform: 'translateY(-50%)'
                    }}
                  ></div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="30"
                    value={clipDuration}
                    onChange={(e) => setClipDuration(parseInt(e.target.value))}
                    className="w-full bg-transparent rounded-lg appearance-none cursor-pointer relative"
                    style={{ margin: 0, padding: 0, height: '24px' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>30s</span>
                  <span className="hidden sm:inline">1m</span>
                  <span className="hidden md:inline">1m30s</span>
                  <span className="hidden sm:inline">2m</span>
                  <span className="hidden md:inline">2m30s</span>
                  <span className="hidden sm:inline">3m</span>
                  <span className="hidden md:inline">3m30s</span>
                  <span className="hidden sm:inline">4m</span>
                  <span className="hidden md:inline">4m30s</span>
                  <span>5m</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🎬 Number of Clips: {numClips}
                </label>
                <div className="relative" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                  {/* Background unfilled bar */}
                  <div className="absolute left-0 w-full h-2 bg-gray-300 rounded-lg pointer-events-none" style={{ top: 'calc(50% + 2px)', transform: 'translateY(-50%)' }}></div>
                  {/* Progress fill bar */}
                  <div className="absolute left-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-l-lg pointer-events-none transition-all duration-200"
                    style={{ 
                      width: `${((numClips - 1) / (10 - 1)) * 100}%`,
                      top: 'calc(50% + 2px)',
                      transform: 'translateY(-50%)'
                    }}
                  ></div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={numClips}
                    onChange={(e) => setNumClips(parseInt(e.target.value))}
                    className="w-full bg-transparent rounded-lg appearance-none cursor-pointer relative"
                    style={{ margin: 0, padding: 0, height: '24px' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1</span>
                  <span className="hidden sm:inline">2</span>
                  <span className="hidden md:inline">3</span>
                  <span className="hidden sm:inline">4</span>
                  <span className="hidden md:inline">5</span>
                  <span className="hidden sm:inline">6</span>
                  <span className="hidden md:inline">7</span>
                  <span className="hidden sm:inline">8</span>
                  <span className="hidden md:inline">9</span>
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
  );
}

export default AdvancedOptions;
