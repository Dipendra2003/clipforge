"""
Cloudinary Cloud Storage Integration
Handles video and image uploads to Cloudinary
"""
import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

# Check if cloud storage is enabled
USE_CLOUD_STORAGE = os.getenv('USE_CLOUD_STORAGE', 'true').lower() == 'true'

def is_configured():
    """Check if Cloudinary is properly configured"""
    return all([
        os.getenv('CLOUDINARY_CLOUD_NAME'),
        os.getenv('CLOUDINARY_API_KEY'),
        os.getenv('CLOUDINARY_API_SECRET')
    ])

def upload_video(file_path, folder="videos", public_id=None, use_async=False):
    """
    Upload video to Cloudinary
    
    Args:
        file_path: Local path to video file
        folder: Cloudinary folder name (videos, clips, etc.)
        public_id: Custom public ID (optional)
        use_async: Use async upload for large files (default: auto-detect)
    
    Returns:
        dict: {
            'success': bool,
            'url': str,
            'secure_url': str,
            'public_id': str,
            'format': str,
            'duration': float,
            'bytes': int
        }
    """
    if not USE_CLOUD_STORAGE or not is_configured():
        print("⚠️ Cloudinary not configured or disabled")
        return {'success': False, 'error': 'Cloud storage not configured'}
    
    try:
        print(f"📤 Uploading to Cloudinary: {file_path}")
        
        # Auto-detect if we should use async based on file size
        # Files larger than 20MB should use async upload
        file_size = os.path.getsize(file_path)
        file_size_mb = file_size / (1024 * 1024)
        
        if not use_async and file_size_mb > 20:
            use_async = True
            print(f"⚡ File size {file_size_mb:.1f}MB - using async upload")
        
        upload_options = {
            'resource_type': "video",
            'folder': folder,
            'public_id': public_id,
            'overwrite': True,
            'tags': ["clipforge", folder]
        }
        
        # Add async options for large files
        if use_async:
            # For large files, use async upload without eager transformations
            # This prevents "too large to process synchronously" errors
            upload_options['eager_async'] = True
            upload_options['eager'] = []  # Empty eager array for async processing
        else:
            # For smaller files, add quality optimizations
            upload_options['quality'] = "auto"
            upload_options['fetch_format'] = "auto"
        
        # Upload video with options
        result = cloudinary.uploader.upload(
            file_path,
            **upload_options
        )
        
        print(f"✅ Upload successful: {result['secure_url']}")
        
        return {
            'success': True,
            'url': result['url'],
            'secure_url': result['secure_url'],
            'public_id': result['public_id'],
            'format': result.get('format', 'mp4'),
            'duration': result.get('duration', 0),
            'bytes': result.get('bytes', 0),
            'created_at': result.get('created_at', ''),
            'async_upload': use_async
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Cloudinary upload error: {error_msg}")
        
        # If sync upload failed due to size, retry with async
        if 'too large' in error_msg.lower() and not use_async:
            print("⚡ Retrying with async upload...")
            return upload_video(file_path, folder, public_id, use_async=True)
        
        return {
            'success': False,
            'error': error_msg
        }

def upload_image(file_path, folder="thumbnails", public_id=None):
    """
    Upload image/thumbnail to Cloudinary
    
    Args:
        file_path: Local path to image file
        folder: Cloudinary folder name
        public_id: Custom public ID (optional)
    
    Returns:
        dict: Upload result with URL
    """
    if not USE_CLOUD_STORAGE or not is_configured():
        return {'success': False, 'error': 'Cloud storage not configured'}
    
    try:
        print(f"📤 Uploading image to Cloudinary: {file_path}")
        
        result = cloudinary.uploader.upload(
            file_path,
            resource_type="image",
            folder=folder,
            public_id=public_id,
            overwrite=True,
            # Image optimization
            quality="auto:good",
            fetch_format="auto",
            tags=["clipforge", folder]
        )
        
        print(f"✅ Image upload successful: {result['secure_url']}")
        
        return {
            'success': True,
            'url': result['url'],
            'secure_url': result['secure_url'],
            'public_id': result['public_id'],
            'format': result.get('format', 'jpg'),
            'bytes': result.get('bytes', 0)
        }
        
    except Exception as e:
        print(f"❌ Cloudinary image upload error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def delete_file(public_id, resource_type="video"):
    """
    Delete file from Cloudinary
    
    Args:
        public_id: Cloudinary public ID
        resource_type: 'video' or 'image'
    
    Returns:
        bool: Success status
    """
    if not USE_CLOUD_STORAGE or not is_configured():
        return False
    
    try:
        print(f"🗑️ Deleting from Cloudinary: {public_id}")
        
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type
        )
        
        if result.get('result') == 'ok':
            print(f"✅ Deleted successfully: {public_id}")
            return True
        else:
            print(f"⚠️ Delete failed: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Cloudinary delete error: {e}")
        return False

def get_storage_info():
    """
    Get Cloudinary account storage information
    
    Returns:
        dict: Storage usage statistics
    """
    if not is_configured():
        return {'error': 'Not configured'}
    
    try:
        usage = cloudinary.api.usage()
        
        return {
            'plan': usage.get('plan', 'unknown'),
            'used_gb': usage.get('storage', {}).get('usage', 0) / (1024**3),
            'limit_gb': usage.get('storage', {}).get('limit', 0) / (1024**3),
            'bandwidth_used_gb': usage.get('bandwidth', {}).get('usage', 0) / (1024**3),
            'bandwidth_limit_gb': usage.get('bandwidth', {}).get('limit', 0) / (1024**3),
            'resources': usage.get('resources', 0),
            'transformations': usage.get('transformations', {}).get('usage', 0)
        }
        
    except Exception as e:
        print(f"❌ Error getting storage info: {e}")
        return {'error': str(e)}

def generate_video_url(public_id, transformations=None):
    """
    Generate optimized video URL with transformations
    
    Args:
        public_id: Cloudinary public ID
        transformations: Dict of transformation options
    
    Returns:
        str: Optimized video URL
    """
    if not is_configured():
        return None
    
    try:
        # Default transformations for web delivery
        default_transforms = {
            'quality': 'auto',
            'fetch_format': 'auto'
        }
        
        if transformations:
            default_transforms.update(transformations)
        
        url = cloudinary.CloudinaryVideo(public_id).build_url(**default_transforms)
        return url
        
    except Exception as e:
        print(f"❌ Error generating URL: {e}")
        return None

# Test function
def test_connection():
    """Test Cloudinary connection"""
    if not is_configured():
        print("❌ Cloudinary not configured")
        print("Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env")
        return False
    
    try:
        # Try to get account info
        info = get_storage_info()
        if 'error' not in info:
            print("✅ Cloudinary connection successful!")
            print(f"Plan: {info['plan']}")
            print(f"Storage used: {info['used_gb']:.2f} GB / {info['limit_gb']:.2f} GB")
            print(f"Bandwidth used: {info['bandwidth_used_gb']:.2f} GB / {info['bandwidth_limit_gb']:.2f} GB")
            return True
        else:
            print(f"❌ Connection failed: {info['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    # Test the connection
    test_connection()
