"""
Video Processing Pipeline with Whisper, FFmpeg, and Gemini AI
"""
import os
import sys
import json
import warnings
import whisper
import google.generativeai as genai
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from utils.cloudinary_storage import upload_video, upload_image, USE_CLOUD_STORAGE

# Suppress PyTorch warnings
warnings.filterwarnings('ignore', category=UserWarning, module='torch')
warnings.filterwarnings('ignore', category=FutureWarning, module='torch')
warnings.filterwarnings('ignore', category=DeprecationWarning)

# Suppress specific PyTorch cleanup warnings
import atexit
original_excepthook = sys.excepthook

def custom_excepthook(exc_type, exc_value, exc_traceback):
    # Ignore PyTorch cleanup errors
    if exc_type == KeyboardInterrupt:
        print('\n\n🛑 Processing interrupted by user')
        return
    if 'torch' in str(exc_value).lower() or 'weakref' in str(exc_value).lower():
        return
    original_excepthook(exc_type, exc_value, exc_traceback)

sys.excepthook = custom_excepthook

load_dotenv()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class VideoProcessor:
    def __init__(self, video_path, output_dir="downloads"):
        self.video_path = video_path
        self.output_dir = output_dir
        self.video_id = Path(video_path).stem
        self.whisper_model = None
        
    def load_whisper_model(self, model_size="tiny"):
        """Load Whisper model for transcription"""
        if not self.whisper_model:
            print(f"Loading Whisper {model_size} model...")
            self.whisper_model = whisper.load_model(model_size)
        return self.whisper_model
    
    def generate_subtitles(self, language=None):
        """Generate subtitles using Whisper with language detection"""
        print("Generating subtitles with Whisper...")
        
        try:
            model = self.load_whisper_model()
            
            # First, detect the language if not specified
            if not language:
                print("Detecting language...")
                audio = whisper.load_audio(self.video_path)
                audio = whisper.pad_or_trim(audio)
                mel = whisper.log_mel_spectrogram(audio).to(model.device)
                _, probs = model.detect_language(mel)
                detected_language = max(probs, key=probs.get)
                print(f"Detected language: {detected_language} (confidence: {probs[detected_language]:.2%})")
                language = detected_language
            
            # Transcribe with specified language for better accuracy
            print(f"Transcribing video in {language}: {self.video_path}")
            result = model.transcribe(
                self.video_path,
                language=language,  # Specify language for better accuracy
                fp16=False,  # Disable FP16 for CPU
                verbose=False,
                task='transcribe',  # Use 'transcribe' not 'translate'
                word_timestamps=False,  # Disable for faster processing
                condition_on_previous_text=True  # Better context awareness
            )
            
            # Add detected language to result
            result['detected_language'] = language
            
            # Save as VTT format
            subtitle_path = os.path.join(self.output_dir, f"{self.video_id}.vtt")
            self._save_vtt(result, subtitle_path)
            
            # Save as JSON for easier processing
            json_path = os.path.join(self.output_dir, f"{self.video_id}_transcript.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"Subtitles saved to {subtitle_path} (Language: {language})")
            return subtitle_path, result
            
        except Exception as e:
            print(f"Whisper transcription error: {e}")
            print("Creating empty subtitle file as fallback...")
            
            # Create empty subtitle file
            subtitle_path = os.path.join(self.output_dir, f"{self.video_id}.vtt")
            with open(subtitle_path, 'w', encoding='utf-8') as f:
                f.write("WEBVTT\n\n")
            
            # Return empty result
            return subtitle_path, {'text': '', 'segments': [], 'detected_language': 'unknown'}
    
    def _save_vtt(self, transcription, output_path):
        """Convert Whisper output to VTT format"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("WEBVTT\n\n")
            
            for i, segment in enumerate(transcription['segments']):
                start = self._format_timestamp(segment['start'])
                end = self._format_timestamp(segment['end'])
                text = segment['text'].strip()
                
                f.write(f"{i + 1}\n")
                f.write(f"{start} --> {end}\n")
                f.write(f"{text}\n\n")
    
    def _format_timestamp(self, seconds):
        """Format seconds to VTT timestamp (HH:MM:SS.mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"
    
    def analyze_with_ai(self, transcript, options=None):
        """Analyze video transcript with Gemini AI to find viral moments"""
        if not GEMINI_API_KEY:
            print("Warning: GEMINI_API_KEY not found. Using fallback analysis.")
            return self._fallback_analysis(transcript, options)
        
        if options is None:
            options = {}
        
        clip_duration = options.get('clip_duration', 45)
        num_clips = options.get('num_clips', 5)
        min_viral_score = options.get('min_viral_score', 0.5)
        clip_mode = options.get('clip_mode', 'ai')  # 'ai', 'divide', or 'range'
        video_metadata = options.get('video_metadata', {})
        
        # If mode is divide or range, use fallback analysis
        if clip_mode in ['divide', 'range']:
            return self._fallback_analysis(transcript, options)
        
        print("Analyzing video with Gemini AI...")
        
        # Extract video context
        video_title = video_metadata.get('title', '')
        video_description = video_metadata.get('description', '')
        video_tags = video_metadata.get('tags', [])
        video_categories = video_metadata.get('categories', [])
        
        # Build context string
        context_parts = []
        if video_title:
            context_parts.append(f"Video Title: {video_title}")
        if video_description:
            # Limit description to first 500 chars
            desc = video_description[:500] + "..." if len(video_description) > 500 else video_description
            context_parts.append(f"Description: {desc}")
        if video_tags:
            context_parts.append(f"Tags: {', '.join(video_tags[:10])}")
        if video_categories:
            context_parts.append(f"Categories: {', '.join(video_categories)}")
        
        video_context = "\n".join(context_parts) if context_parts else "No video metadata available"
        
        try:
            # Use the model specified in environment or default
            model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
            print(f"Attempting to use Gemini model: {model_name}")
            model = genai.GenerativeModel(model_name)
            
            prompt = f"""
Analyze this video transcript and identify the top {num_clips} most viral-worthy moments for short-form content.

VIDEO CONTEXT:
{video_context}

IMPORTANT REQUIREMENTS:
1. Each clip MUST be EXACTLY {clip_duration} seconds long
2. Calculate end_time as: start_time + {clip_duration}
3. Generate titles that are RELEVANT to the actual video content and context above
4. Titles should match the video's theme, mood, and genre (e.g., if it's a song, use music-related titles; if it's comedy, use funny titles; if it's educational, use informative titles)
5. DO NOT use generic clickbait titles that don't relate to the video content
6. Consider the video title, description, and tags when creating clip titles

For each moment, provide:
1. Start time (in seconds)
2. End time (in seconds) - MUST be exactly start_time + {clip_duration}
3. Emotion/vibe (joy, excitement, surprise, inspiration, humor, tension, romantic, sad, energetic, etc.)
4. Viral score (0 to 100) - must be at least {min_viral_score * 100} (as percentage)
5. Why it's viral-worthy (brief explanation)
6. Contextual title for the clip that reflects the actual video content and theme

Transcript:
{json.dumps(transcript['segments'][:50], indent=2)}

Respond in JSON format:
{{
  "clips": [
    {{
      "start_time": 10.0,
      "end_time": 55.0,
      "emotion": "excitement",
      "viral_score": 92,
      "reason": "High energy moment with surprising revelation",
      "title": "[Title that matches the video's actual content and theme]"
    }}
  ]
}}

Remember: 
- end_time MUST equal start_time + {clip_duration} seconds!
- viral_score should be 0-100 (percentage)
- Titles MUST be relevant to the video's actual content, theme, and genre
- Use the video context provided above to create appropriate titles
"""
            
            response = model.generate_content(prompt)
            result_text = response.text
            
            # Extract JSON from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            analysis = json.loads(result_text.strip())
            
            # Debug: Print raw AI response
            print(f"🤖 AI Analysis Response:")
            for i, clip in enumerate(analysis.get('clips', [])[:3]):
                score = clip.get('viral_score', 0)
                # If score is between 0-1, convert to percentage
                if score <= 1.0:
                    score = score * 100
                    clip['viral_score'] = score
                print(f"  Clip {i+1}: Score={score:.0f}%, Title={clip.get('title', 'N/A')}")
            
            # Filter by viral score (convert min_viral_score to percentage if needed)
            min_score_threshold = min_viral_score * 100 if min_viral_score <= 1.0 else min_viral_score
            filtered_clips = [c for c in analysis['clips'] if c.get('viral_score', 0) >= min_score_threshold]
            analysis['clips'] = filtered_clips[:num_clips]
            
            print(f"AI identified {len(analysis['clips'])} viral moments")
            return analysis
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            return self._fallback_analysis(transcript, options)
    
    def _fallback_analysis(self, transcript, options=None):
        """Fallback analysis when AI is unavailable"""
        print("Using fallback analysis (no AI)...")
        
        if options is None:
            options = {}
        
        # Get options with proper defaults
        clip_duration = options.get('clip_duration') or 45
        num_clips = options.get('num_clips')
        if num_clips is None:
            num_clips = 5
        clip_mode = options.get('clip_mode', 'ai')  # 'ai', 'divide', or 'range'
        
        # Ensure numeric values
        clip_duration = float(clip_duration)
        num_clips = int(num_clips)
        
        print(f"Fallback options: clip_duration={clip_duration}, num_clips={num_clips}, mode={clip_mode}")
        
        clips = []
        segments = transcript.get('segments', [])
        
        print(f"Transcript segments: {len(segments)}")
        
        # Get video duration
        duration = 60.0  # Default duration
        if segments and len(segments) > 0:
            last_segment = segments[-1]
            print(f"Last segment: {last_segment}")
            duration = float(last_segment.get('end', 60))
        
        print(f"Video duration: {duration}")
        
        # Handle different clip modes
        if clip_mode == 'range':
            # User specified start and end time
            start_time = float(options.get('start_time') or 0)
            end_time = float(options.get('end_time') or duration)
            
            print(f"Range mode: Processing from {start_time}s to {end_time}s")
            
            # Create clips within the specified range
            current_time = start_time
            clip_count = 0
            
            while current_time < end_time and clip_count < num_clips:
                clip_end = min(current_time + clip_duration, end_time)
                
                if clip_end - current_time >= 10.0:  # Minimum 10 seconds
                    clips.append({
                        "start_time": float(current_time),
                        "end_time": float(clip_end),
                        "emotion": "general",
                        "viral_score": 75,  # Changed to percentage (0-100)
                        "reason": f"Clip from specified range ({start_time}s - {end_time}s)",
                        "title": f"Highlight Clip {clip_count + 1}"
                    })
                    clip_count += 1
                
                current_time = clip_end
        
        elif clip_mode == 'divide':
            # Divide entire video into equal clips of specified duration
            print(f"Divide mode: Dividing entire video into {clip_duration}s clips")
            
            current_time = 0.0
            clip_count = 0
            
            # Calculate how many clips we can create
            max_possible_clips = int(duration / clip_duration)
            
            # If num_clips is 0, create all possible clips
            if num_clips == 0:
                clips_to_create = max_possible_clips
            else:
                clips_to_create = min(max_possible_clips, num_clips)
            
            print(f"Can create {max_possible_clips} clips, will create {clips_to_create}")
            
            while current_time < duration and clip_count < clips_to_create:
                clip_end = min(current_time + clip_duration, duration)
                
                if clip_end - current_time >= 10.0:  # Minimum 10 seconds
                    clips.append({
                        "start_time": float(current_time),
                        "end_time": float(clip_end),
                        "emotion": "general",
                        "viral_score": 75,  # Changed to percentage (0-100)
                        "reason": f"Auto-divided clip ({clip_duration}s segments)",
                        "title": f"Video Segment {clip_count + 1}"
                    })
                    clip_count += 1
                
                current_time = clip_end
        
        else:
            # Default AI mode - create clips from start
            start_time = float(options.get('start_time') or 0)
            end_time = float(options.get('end_time') or duration)
            
            print(f"AI mode (fallback): Processing from {start_time}s to {end_time}s")
            
            current_time = start_time
            clip_count = 0
            
            while current_time < end_time and clip_count < num_clips:
                clip_end = min(current_time + clip_duration, end_time)
                
                if clip_end - current_time >= 10.0:  # Minimum 10 seconds
                    clips.append({
                        "start_time": float(current_time),
                        "end_time": float(clip_end),
                        "emotion": "general",
                        "viral_score": 75,  # Changed to percentage (0-100)
                        "reason": "Auto-generated clip segment",
                        "title": f"Video Clip {clip_count + 1}"
                    })
                    clip_count += 1
                
                current_time = clip_end
        
        print(f"Generated {len(clips)} clips")
        return {"clips": clips}
    
    def create_clip(self, start_time, end_time, output_path, add_subtitles=True, subtitle_path=None):
        """Create a video clip using FFmpeg"""
        print(f"Creating clip: {start_time}s to {end_time}s...")
        
        duration = end_time - start_time
        
        # Build FFmpeg command
        # IMPORTANT: -ss before -i for accurate seeking
        cmd = [
            'ffmpeg',
            '-ss', str(start_time),  # Seek BEFORE input for accuracy
            '-i', self.video_path,
            '-t', str(duration),
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-preset', 'fast',
            '-crf', '23',
            '-avoid_negative_ts', 'make_zero',  # Fix timestamp issues
            '-y'  # Overwrite output file
        ]
        
        # Add subtitles if available
        if add_subtitles and subtitle_path and os.path.exists(subtitle_path):
            # Fix path for Windows - use forward slashes or escape backslashes
            subtitle_path_fixed = subtitle_path.replace('\\', '/')
            cmd.extend(['-vf', f"subtitles={subtitle_path_fixed}"])
        
        cmd.append(output_path)
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"Clip saved to {output_path}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return False
    
    def generate_thumbnail(self, time_offset=5):
        """Generate thumbnail from video at specific time"""
        thumbnail_path = os.path.join(self.output_dir, f"{self.video_id}_thumb.jpg")
        
        cmd = [
            'ffmpeg',
            '-i', self.video_path,
            '-ss', str(time_offset),
            '-vframes', '1',
            '-q:v', '2',
            '-y',
            thumbnail_path
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"Thumbnail saved to {thumbnail_path}")
            return thumbnail_path
        except subprocess.CalledProcessError as e:
            print(f"Thumbnail generation error: {e}")
            return None
    
    def get_video_info(self):
        """Get video metadata using FFprobe"""
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            self.video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            info = json.loads(result.stdout)
            
            duration = float(info['format'].get('duration', 0))
            size = int(info['format'].get('size', 0))
            
            return {
                'duration': int(duration),
                'file_size': size,
                'format': info['format'].get('format_name', 'unknown')
            }
        except Exception as e:
            print(f"Error getting video info: {e}")
            return {'duration': 0, 'file_size': 0, 'format': 'unknown'}
    
    def process_full_pipeline(self, skip_subtitles=False, options=None, progress_callback=None):
        """Run the complete processing pipeline with progress tracking"""
        if options is None:
            options = {}
        
        clip_duration = options.get('clip_duration', 45)
        num_clips = options.get('num_clips', 5)
        min_viral_score = options.get('min_viral_score', 0.5)
        start_time = options.get('start_time')
        end_time = options.get('end_time')
        emotion_filter = options.get('emotions', [])
        subtitle_language = options.get('subtitle_language')  # Optional language specification
        
        print(f"\n{'='*60}")
        print(f"Starting video processing pipeline for: {self.video_path}")
        if skip_subtitles:
            print("⚡ FAST MODE: Skipping subtitle generation")
        if subtitle_language:
            print(f"Subtitle language: {subtitle_language}")
        print(f"Options: Duration={clip_duration}s, Clips={num_clips}, MinScore={min_viral_score}")
        print(f"{'='*60}\n")
        
        results = {
            'video_id': self.video_id,
            'video_path': self.video_path,
            'status': 'processing'
        }
        
        try:
            # Step 1: Get video info (0-10%)
            if progress_callback:
                progress_callback(5, 'Extracting video metadata...')
            print("Step 1: Extracting video metadata...")
            video_info = self.get_video_info()
            results['video_info'] = video_info
            if progress_callback:
                progress_callback(10, 'Video metadata extracted')
            
            # Step 2: Generate subtitles (10-40%)
            if not skip_subtitles:
                if progress_callback:
                    progress_callback(15, 'Generating subtitles with Whisper...')
                print("\nStep 2: Generating subtitles with Whisper...")
                subtitle_path, transcript = self.generate_subtitles(language=subtitle_language)
                results['subtitle_path'] = subtitle_path
                results['transcript'] = transcript
                results['detected_language'] = transcript.get('detected_language', 'unknown')
                if progress_callback:
                    progress_callback(40, 'Subtitles generated successfully')
            else:
                if progress_callback:
                    progress_callback(15, 'Skipping subtitle generation (fast mode)')
                print("\nStep 2: Skipping subtitle generation (fast mode)")
                subtitle_path = None
                # Create minimal transcript for AI analysis with proper duration
                video_duration = video_info.get('duration', 60)
                transcript = {
                    'text': 'Video content',
                    'segments': [
                        {'start': 0, 'end': video_duration, 'text': 'Video content'}
                    ]
                }
                results['transcript'] = transcript
                if progress_callback:
                    progress_callback(40, 'Subtitle generation skipped')
            
            # Step 3: AI analysis (40-55%)
            if progress_callback:
                progress_callback(45, 'Analyzing video with AI...')
            print("\nStep 3: Analyzing video with AI...")
            analysis = self.analyze_with_ai(transcript, options)
            results['analysis'] = analysis
            if progress_callback:
                progress_callback(55, 'AI analysis completed')
            
            # Step 4: Generate thumbnail (55-60%)
            if progress_callback:
                progress_callback(57, 'Generating thumbnail...')
            print("\nStep 4: Generating thumbnail...")
            thumbnail = self.generate_thumbnail()
            results['thumbnail_path'] = thumbnail
            
            # Upload thumbnail to Cloudinary if enabled
            if thumbnail and USE_CLOUD_STORAGE:
                print("☁️ Uploading thumbnail to Cloudinary...")
                upload_result = upload_image(
                    thumbnail,
                    folder="thumbnails",
                    public_id=f"{self.video_id}_thumb"
                )
                
                if upload_result['success']:
                    results['thumbnail_cloud_url'] = upload_result['secure_url']
                    print(f"✅ Thumbnail uploaded: {upload_result['secure_url']}")
                    
                    # Delete local thumbnail after successful upload
                    try:
                        os.remove(thumbnail)
                        print(f"🗑️ Local thumbnail deleted")
                    except Exception as e:
                        print(f"⚠️ Could not delete local thumbnail: {e}")
                else:
                    print(f"⚠️ Thumbnail upload failed, keeping local file")
                    # Keep local file if upload failed
            
            if progress_callback:
                progress_callback(60, 'Thumbnail generated')
            
            # Step 5: Create clips (60-100%)
            if progress_callback:
                progress_callback(65, 'Creating video clips...')
            print("\nStep 5: Creating video clips...")
            clips_created = []
            
            # Ensure analysis has clips
            if not analysis or 'clips' not in analysis or not analysis['clips']:
                print("⚠️ No clips found in analysis")
                results['clips'] = []
                results['status'] = 'completed'
                if progress_callback:
                    progress_callback(100, 'No clips to create')
                return results
            
            # Create clips subfolder for better organization
            clips_folder = os.path.join(self.output_dir, "clips")
            os.makedirs(clips_folder, exist_ok=True)
            print(f"📁 Clips will be saved to: {clips_folder}")
            
            # Limit to requested number of clips
            # If num_clips is 0, create all clips (for divide mode)
            if num_clips == 0:
                max_clips = len(analysis['clips'])
            else:
                max_clips = min(len(analysis['clips']), num_clips)
            
            print(f"Creating {max_clips} clips from {len(analysis['clips'])} analyzed segments...")
            
            # Calculate progress increment per clip (60% to 100% = 40% total)
            progress_per_clip = 35 / max_clips if max_clips > 0 else 0
            current_progress = 65
            
            for i, clip_data in enumerate(analysis['clips'][:max_clips]):
                clip_filename = f"{self.video_id}_clip_{i+1}.mp4"
                clip_path = os.path.join(clips_folder, clip_filename)
                
                if progress_callback:
                    progress_callback(
                        int(current_progress), 
                        f'Creating clip {i+1}/{max_clips}...'
                    )
                
                # Validate and correct clip duration
                start_time = float(clip_data['start_time'])
                end_time = float(clip_data['end_time'])
                actual_duration = end_time - start_time
                
                # If duration is not close to target, adjust end_time
                target_duration = clip_duration
                if abs(actual_duration - target_duration) > 5:  # More than 5 seconds off
                    print(f"⚠️ Clip {i+1} duration {actual_duration:.1f}s differs from target {target_duration}s, adjusting...")
                    end_time = start_time + target_duration
                    
                    # Make sure we don't exceed video duration
                    video_duration = video_info.get('duration', 0)
                    if end_time > video_duration:
                        end_time = video_duration
                        start_time = max(0, end_time - target_duration)
                    
                    print(f"✓ Adjusted to {start_time:.1f}s - {end_time:.1f}s ({end_time - start_time:.1f}s)")
                
                # Only add subtitles if they were successfully generated
                has_subtitles = subtitle_path and os.path.exists(subtitle_path) and os.path.getsize(subtitle_path) > 10
                
                success = self.create_clip(
                    start_time,
                    end_time,
                    clip_path,
                    add_subtitles=has_subtitles,
                    subtitle_path=subtitle_path if has_subtitles else None
                )
                
                if success:
                    clip_info = {
                        'clip_number': i + 1,
                        'file_path': clip_path,
                        'start_time': start_time,  # Use corrected time
                        'end_time': end_time,  # Use corrected time
                        'duration': end_time - start_time,  # Calculate from corrected times
                        'emotion': clip_data.get('emotion', 'general'),
                        'viral_score': clip_data.get('viral_score', 0.7),
                        'title': clip_data.get('title', f'Clip {i+1}'),
                        'reason': clip_data.get('reason', 'Generated clip')
                    }
                    
                    # Upload to Cloudinary if enabled
                    if USE_CLOUD_STORAGE:
                        if progress_callback:
                            progress_callback(
                                int(current_progress), 
                                f'Uploading clip {i+1}/{max_clips} to cloud...'
                            )
                        
                        print(f"☁️ Uploading clip {i+1} to Cloudinary...")
                        upload_result = upload_video(
                            clip_path, 
                            folder="clips",
                            public_id=f"{self.video_id}_clip_{i+1}"
                        )
                        
                        if upload_result['success']:
                            clip_info['cloud_url'] = upload_result['secure_url']
                            clip_info['cloudinary_public_id'] = upload_result['public_id']
                            print(f"✅ Clip uploaded: {upload_result['secure_url']}")
                            
                            # Delete local file after successful upload
                            try:
                                os.remove(clip_path)
                                print(f"🗑️ Local file deleted: {clip_path}")
                            except Exception as e:
                                print(f"⚠️ Could not delete local file: {e}")
                        else:
                            print(f"⚠️ Cloud upload failed, keeping local file")
                    
                    clips_created.append(clip_info)
                
                current_progress += progress_per_clip
            
            results['clips'] = clips_created
            results['status'] = 'completed'
            
            if progress_callback:
                progress_callback(100, f'Complete! Created {len(clips_created)} clips')
            
            print(f"\n{'='*60}")
            print(f"✅ Processing completed! Created {len(clips_created)} clips")
            print(f"{'='*60}\n")
            
        except Exception as e:
            print(f"\n❌ Error during processing: {e}")
            results['status'] = 'failed'
            results['error'] = str(e)
            if progress_callback:
                progress_callback(0, f'Failed: {str(e)}')
        
        return results


def process_video(video_path, output_dir="downloads"):
    """Main function to process a video"""
    processor = VideoProcessor(video_path, output_dir)
    return processor.process_full_pipeline()


if __name__ == "__main__":
    # Test the processor
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python video_processor.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)
    
    results = process_video(video_path)
    
    # Save results to JSON
    output_json = f"{Path(video_path).stem}_results.json"
    with open(output_json, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {output_json}")
