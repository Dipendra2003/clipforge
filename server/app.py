from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import yt_dlp
import os
import uuid
import json
import time
import threading
from video_processor import VideoProcessor
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Store processing progress for each video
processing_progress = {}

DOWNLOAD_FOLDER = "downloads"
CLIPS_FOLDER = "downloads/clips"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
os.makedirs(CLIPS_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/download", methods=["POST"])
def download_video():
    data = request.json
    url = data.get("url")
    quality = data.get("quality", "720p")  # Default to 720p

    if not url:
        return jsonify({"error": "URL missing"}), 400

    file_id = str(uuid.uuid4())
    output = os.path.join(DOWNLOAD_FOLDER, file_id)

    # Map quality to yt-dlp format string
    quality_map = {
        "2160p": "best[height<=2160]",
        "1440p": "best[height<=1440]",
        "1080p": "best[height<=1080]",
        "720p": "best[height<=720]",
        "480p": "best[height<=480]",
        "360p": "best[height<=360]"
    }
    
    format_string = quality_map.get(quality, "best[height<=720]")

    ydl_opts = {
        "outtmpl": f"{output}.%(ext)s",
        "format": format_string,
        "merge_output_format": "mp4",
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["en"],
        "ignoreerrors": True,  # Don't fail if subtitles can't be downloaded
        "quiet": False,  # Show output for debugging
        "no_warnings": False,
        # Add user agent to avoid bot detection
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        # Additional options to bypass restrictions
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"],
                "skip": ["hls", "dash"]
            }
        },
    }

    try:
        print(f"Attempting to download: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first to check if video is available
            info = ydl.extract_info(url, download=False)
            print(f"Video title: {info.get('title', 'Unknown')}")
            print(f"Duration: {info.get('duration', 0)} seconds")
            
            # Now download
            ydl.download([url])

        print(f"Download completed: {file_id}")
        
        # Check if subtitle file exists
        subtitle_path = os.path.join(DOWNLOAD_FOLDER, f"{file_id}.en.vtt")
        has_subtitles = os.path.exists(subtitle_path)
        
        response_data = {
            "videoUrl": f"http://127.0.0.1:5001/video/{file_id}.mp4",
            "title": info.get('title', 'Downloaded Video'),
            "duration": info.get('duration', 0),
            "hasSubtitles": has_subtitles,
            "quality": quality
        }
        
        if has_subtitles:
            response_data["subtitleUrl"] = f"http://127.0.0.1:5001/video/{file_id}.en.vtt"
        
        return jsonify(response_data)

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        print(f"Download error: {error_msg}")
        
        # Check for specific error types
        if "Sign in to confirm" in error_msg or "bot" in error_msg.lower():
            return jsonify({
                "error": "YouTube bot detection triggered. Try these solutions:",
                "solutions": [
                    "1. Try a different video (some videos have stricter protection)",
                    "2. Use a shorter video (under 5 minutes)",
                    "3. Try a video from a different channel",
                    "4. Update yt-dlp: pip install --upgrade yt-dlp"
                ]
            }), 403
        elif "Video unavailable" in error_msg:
            return jsonify({"error": "Video is unavailable or private"}), 404
        elif "429" in error_msg or "Too Many Requests" in error_msg:
            return jsonify({
                "error": "Rate limited by YouTube. Please wait a few minutes and try again.",
                "tip": "Try using Vimeo or Dailymotion instead - they don't have rate limits!"
            }), 429
        else:
            return jsonify({"error": f"Download failed: {error_msg}"}), 500
            
    except Exception as e:
        error_msg = str(e)
        print(f"Unexpected error: {error_msg}")
        return jsonify({"error": f"Unexpected error: {error_msg}"}), 500


# @app.route("/video/<filename>")
# def serve_video(filename):
#     return send_from_directory(DOWNLOAD_FOLDER, filename)


@app.route("/video/<filename>")
def serve_video(filename):
    try:
        print(f"Serving video file: {filename}")
        response = send_from_directory(DOWNLOAD_FOLDER, filename)

        if filename.endswith(".vtt"):
            response.headers["Content-Type"] = "text/vtt"
        
        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        
        # Add cache control headers to prevent stale cache issues
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
        # Add Accept-Ranges header for video seeking
        response.headers["Accept-Ranges"] = "bytes"
        
        print(f"✅ Successfully serving: {filename}")
        return response
    except Exception as e:
        print(f"❌ Error serving video {filename}: {e}")
        return jsonify({"error": f"File not found: {filename}"}), 404


@app.route("/upload", methods=["POST"])
def upload_video():
    """Handle video file upload"""
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: MP4, MOV, AVI, MKV, WEBM"}), 400
    
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        # Save uploaded file
        output_path = os.path.join(DOWNLOAD_FOLDER, f"{file_id}.{file_extension}")
        file.save(output_path)
        
        # Get file size
        file_size = os.path.getsize(output_path)
        
        print(f"Video uploaded: {file_id}.{file_extension} ({file_size} bytes)")
        
        return jsonify({
            "success": True,
            "videoId": file_id,
            "videoUrl": f"http://127.0.0.1:5001/video/{file_id}.{file_extension}",
            "filename": filename,
            "fileSize": file_size
        })
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@app.route("/process", methods=["POST"])
def process_video():
    """Process video to generate clips with AI"""
    data = request.json
    video_id = data.get("videoId")
    user_id = data.get("userId")  # Optional - for saving to database
    skip_subtitles = data.get("skipSubtitles", False)  # New option
    quality = data.get("quality", "720p")  # Video quality
    subtitle_language = data.get("subtitleLanguage")  # Optional language specification
    
    # Advanced options
    options = {
        'clip_duration': data.get('clipDuration', 45),  # Default 45 seconds
        'num_clips': data.get('numClips', 5),  # Default 5 clips
        'min_viral_score': data.get('minViralScore', 0.5),  # Minimum 0.5
        'start_time': data.get('startTime'),  # Optional: process from this time
        'end_time': data.get('endTime'),  # Optional: process until this time
        'emotions': data.get('emotions', []),  # Filter by emotions
        'clip_mode': data.get('clipMode', 'ai'),  # 'ai', 'divide', or 'range'
        'quality': quality,  # Video quality for output clips
        'subtitle_language': subtitle_language,  # Subtitle language
    }
    
    if not video_id:
        return jsonify({"error": "Video ID missing"}), 400
    
    # Find the video file
    video_path = None
    for ext in ALLOWED_EXTENSIONS:
        potential_path = os.path.join(DOWNLOAD_FOLDER, f"{video_id}.{ext}")
        if os.path.exists(potential_path):
            video_path = potential_path
            break
    
    if not video_path:
        return jsonify({"error": "Video file not found"}), 404
    
    # Initialize progress tracking
    processing_progress[video_id] = {
        'progress': 0,
        'step': 'Starting...',
        'status': 'processing'
    }
    
    try:
        print(f"Processing video: {video_id}")
        
        # Initialize processor
        processor = VideoProcessor(video_path, DOWNLOAD_FOLDER)
        
        # Create a callback function to update progress
        def progress_callback(progress, step):
            processing_progress[video_id] = {
                'progress': progress,
                'step': step,
                'status': 'processing'
            }
        
        # Run full pipeline with options and progress callback
        results = processor.process_full_pipeline(
            skip_subtitles=skip_subtitles,
            options=options,
            progress_callback=progress_callback
        )
        
        if results['status'] == 'failed':
            processing_progress[video_id] = {
                'progress': 0,
                'step': 'Failed',
                'status': 'failed'
            }
            return jsonify({
                "error": "Processing failed",
                "details": results.get('error', 'Unknown error')
            }), 500
        
        # Mark as complete
        processing_progress[video_id] = {
            'progress': 100,
            'step': 'Complete!',
            'status': 'completed'
        }
        
        # Format response
        response = {
            "success": True,
            "videoId": video_id,
            "userId": user_id,
            "status": results['status'],
            "videoInfo": results.get('video_info', {}),
            "detectedLanguage": results.get('detected_language', 'unknown'),
            "subtitleUrl": f"http://127.0.0.1:5001/video/{video_id}.vtt" if results.get('subtitle_path') else None,
            "thumbnailUrl": f"http://127.0.0.1:5001/video/{video_id}_thumb.jpg" if results.get('thumbnail_path') else None,
            "clips": []
        }
        
        # Add clip information
        for clip in results.get('clips', []):
            clip_filename = os.path.basename(clip['file_path'])
            response['clips'].append({
                "clipNumber": clip['clip_number'],
                "title": clip['title'],
                "startTime": clip['start_time'],
                "endTime": clip['end_time'],
                "duration": clip['duration'],
                "emotion": clip['emotion'],
                "viralScore": clip['viral_score'],
                "reason": clip['reason'],
                "clipUrl": f"http://127.0.0.1:5001/video/{clip_filename}",
                "filePath": clip['file_path']
            })
        
        print(f"✅ Processing completed: {len(response['clips'])} clips created")
        
        # Note: Frontend will handle saving to database via save-processed endpoint
        # This avoids duplicate entries
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Processing error: {e}")
        import traceback
        traceback.print_exc()
        processing_progress[video_id] = {
            'progress': 0,
            'step': 'Failed',
            'status': 'failed'
        }
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


@app.route("/progress/<video_id>", methods=["GET"])
def get_progress(video_id):
    """Get processing progress for a video"""
    if video_id in processing_progress:
        return jsonify(processing_progress[video_id])
    else:
        return jsonify({
            'progress': 0,
            'step': 'Not found',
            'status': 'unknown'
        }), 404


@app.route("/video-info/<video_id>", methods=["GET"])
def get_video_info(video_id):
    """Get video information"""
    video_path = None
    for ext in ALLOWED_EXTENSIONS:
        potential_path = os.path.join(DOWNLOAD_FOLDER, f"{video_id}.{ext}")
        if os.path.exists(potential_path):
            video_path = potential_path
            break
    
    if not video_path:
        return jsonify({"error": "Video not found"}), 404
    
    try:
        processor = VideoProcessor(video_path, DOWNLOAD_FOLDER)
        info = processor.get_video_info()
        
        return jsonify({
            "videoId": video_id,
            "duration": info['duration'],
            "fileSize": info['file_size'],
            "format": info['format']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
