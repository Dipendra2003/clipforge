import { GoogleGenerativeAI } from '@google/generative-ai';
import Clip from '../models/Clip.js';
import logger from '../utils/logger.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use Gemini 2.5 Flash - the latest and fastest model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Initialize Gemini AI
let genai = null;
if (GEMINI_API_KEY) {
  genai = new GoogleGenerativeAI(GEMINI_API_KEY);
  logger.info('Gemini AI initialized', { model: GEMINI_MODEL });
} else {
  logger.error('GEMINI_API_KEY not configured');
}

// Generate AI caption for YouTube post
export const generateCaption = async (req, res) => {
  try {
    const { clipId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!clipId) {
      return res.status(400).json({ error: 'Clip ID is required' });
    }

    // Check if Gemini is configured
    if (!genai) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'GEMINI_API_KEY is not set in environment variables'
      });
    }

    // Fetch clip from database
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Verify ownership
    if (clip.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Extract data for AI generation
    const transcript = clip.transcript || '';
    const emotion = clip.emotion || 'neutral';
    const metadata = clip.metadata || {};
    const keywords = metadata.keywords || [];
    const viralScore = clip.viral_score || 0;

    logger.info('Generating AI caption', { 
      clipId, 
      userId, 
      emotion,
      transcriptLength: transcript.length 
    });

    // Build AI prompt with advanced caption generation
    const prompt = `You are an expert YouTube Shorts content creator and viral marketing specialist. Generate a highly engaging, scroll-stopping caption for this video clip:

📊 VIDEO DATA:
Title: ${clip.title || 'Untitled'}
Transcript: ${transcript || 'No transcript available'}
Emotion/Tone: ${emotion}
Keywords: ${keywords.join(', ') || 'None'}
Viral Potential: ${(viralScore * 100).toFixed(0)}%

🎯 CAPTION STRATEGY:
1. HOOK (First Line): Create a powerful attention-grabbing opening that makes viewers STOP scrolling
   - Use curiosity gaps, shocking statements, or relatable questions
   - Examples: "Wait for it...", "This changed everything 😱", "POV: You just discovered...", "Nobody talks about this..."
   
2. STORY/VALUE (Middle): Build intrigue or deliver value in 1-2 sentences
   - Tell a micro-story or highlight the key moment
   - Create emotional connection or provide insight
   - Make it relatable and shareable
   
3. CALL-TO-ACTION (Optional): Subtle engagement prompt
   - "Tag someone who needs this", "Double tap if you agree", "Save this for later"
   
4. HASHTAGS (End): Strategic mix of trending + niche hashtags
   - 5-8 hashtags total
   - Mix of: #Shorts (required), 1-2 mega hashtags (1M+ posts), 2-3 medium (100K-1M), 2-3 niche (specific to content)
   - Include emotion-based hashtags: #${emotion}

📝 STYLE GUIDELINES:
- Length: 150-300 characters (sweet spot for engagement)
- Emojis: Use 2-4 relevant emojis strategically (not excessive)
- Tone: Match the ${emotion} emotion authentically
- Language: Conversational, authentic, not salesy
- Format: Use line breaks for readability
- Avoid: Generic phrases like "Check this out", "Amazing video", "Don't miss"

🔥 VIRAL ELEMENTS TO INCLUDE:
- Pattern interrupts (unexpected words/phrases)
- Emotional triggers (curiosity, surprise, FOMO, nostalgia)
- Social proof hints if applicable
- Trending phrases or formats (if relevant)

Return ONLY the final caption text with proper formatting and line breaks. No explanations, no meta-commentary, no quotation marks around the caption.`;


    // Generate caption with Gemini
    try {
      const model = genai.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const caption = response.text().trim();

      logger.info('AI caption generated successfully', { 
        clipId, 
        userId,
        captionLength: caption.length 
      });

      // Return generated caption
      res.json({ 
        success: true, 
        caption,
        clipId,
        metadata: {
          emotion,
          viralScore,
          model: GEMINI_MODEL
        }
      });
    } catch (genError) {
      logger.error('Gemini API error', { 
        error: genError.message,
        stack: genError.stack
      });
      
      // FALLBACK: Generate an engaging caption based on clip data
      logger.info('Using fallback caption generation', { clipId });
      
      const emotionData = {
        joy: { emoji: '😊', hook: 'This moment will make your day!', hashtags: '#Happy #Positivity #GoodVibes' },
        excitement: { emoji: '🎉', hook: 'Wait for it... 🔥', hashtags: '#Exciting #Epic #Wow' },
        surprise: { emoji: '😲', hook: 'You won\'t believe what happens next!', hashtags: '#Shocking #Unexpected #Mindblown' },
        humor: { emoji: '😄', hook: 'POV: You needed this laugh today', hashtags: '#Funny #Comedy #LOL' },
        inspiration: { emoji: '✨', hook: 'This hit different... 💯', hashtags: '#Motivation #Inspiring #Powerful' },
        sadness: { emoji: '😢', hook: 'This will touch your heart...', hashtags: '#Emotional #Touching #Heartfelt' },
        empathy: { emoji: '🤝', hook: 'We all felt this...', hashtags: '#Relatable #Real #Truth' },
        tension: { emoji: '😰', hook: 'The suspense is killing me!', hashtags: '#Intense #Dramatic #EdgeOfYourSeat' },
        determination: { emoji: '💪', hook: 'Never give up! Watch till the end', hashtags: '#NeverGiveUp #Strength #Resilience' },
        general: { emoji: '🎬', hook: 'This is worth your time!', hashtags: '#MustWatch #Amazing #Trending' }
      };
      
      const data = emotionData[emotion] || emotionData.general;
      const titlePreview = clip.title ? clip.title.substring(0, 80) : 'Check this out';
      const transcriptSnippet = transcript ? transcript.substring(0, 120).trim() + '...' : '';
      
      const fallbackCaption = `${data.hook} ${data.emoji}

${transcriptSnippet || titlePreview}

#Shorts #Viral ${data.hashtags} #Trending #ForYou`;

      res.json({ 
        success: true, 
        caption: fallbackCaption,
        clipId,
        metadata: {
          emotion,
          viralScore,
          model: 'fallback',
          note: 'AI generation failed, using template-based caption'
        }
      });
    }

  } catch (error) {
    logger.error('AI caption generation error', { 
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      clipId: req.body?.clipId
    });

    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(503).json({ 
        error: 'AI service configuration error',
        message: 'Invalid or missing API key'
      });
    }

    if (error.message?.includes('quota')) {
      return res.status(429).json({ 
        error: 'AI service quota exceeded',
        message: 'Daily API quota reached. Please try again later.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate caption',
      message: error.message || 'An unexpected error occurred'
    });
  }
};
