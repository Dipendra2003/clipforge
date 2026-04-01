# Supported Video Platforms

## ✅ Fully Supported Platforms

Your app can download videos from these platforms:

### Popular Platforms
- **YouTube** - `youtube.com`, `youtu.be`
- **Instagram** - `instagram.com/reel/`, `instagram.com/p/`
- **TikTok** - `tiktok.com/@username/video/`
- **Twitter/X** - `twitter.com`, `x.com`
- **Facebook** - `facebook.com/watch`
- **Vimeo** - `vimeo.com`
- **Dailymotion** - `dailymotion.com`

### Other Supported Platforms
- Reddit videos
- Twitch clips
- Streamable
- LinkedIn videos
- Pinterest videos
- And 1000+ more sites via yt-dlp

## 📝 URL Format Examples

```
✅ YouTube:
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID

✅ Instagram:
https://www.instagram.com/reel/REEL_ID/
https://www.instagram.com/p/POST_ID/

✅ TikTok:
https://www.tiktok.com/@username/video/VIDEO_ID

✅ Twitter/X:
https://twitter.com/username/status/TWEET_ID
https://x.com/username/status/TWEET_ID

✅ Vimeo:
https://vimeo.com/VIDEO_ID

✅ Facebook:
https://www.facebook.com/watch/?v=VIDEO_ID
```

## ⚠️ Common Issues

### Instagram
- Private accounts won't work
- Some reels may have format restrictions
- If download fails, try a different public reel

### YouTube
- Age-restricted videos may fail
- Private/unlisted videos won't work
- Rate limiting may occur with many downloads

### General
- Video must be publicly accessible
- Some platforms require cookies/authentication
- Very long videos (>2 hours) may timeout

## 🔧 Troubleshooting

If download fails:
1. Check if video is public
2. Try a different video from same platform
3. Update yt-dlp: `pip install --upgrade yt-dlp`
4. Check terminal for specific error messages
