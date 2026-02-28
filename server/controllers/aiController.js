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

    // Build AI prompt
    const prompt = `Generate a viral YouTube Shorts caption for this video clip:

TRANSCRIPT:
${transcript || 'No transcript available'}

EMOTION: ${emotion}
KEYWORDS: ${keywords.join(', ') || 'None'}
VIRAL SCORE: ${(viralScore * 100).toFixed(0)}%

REQUIREMENTS:
- Start with an engaging hook that grabs attention
- Keep it concise (2-3 sentences max)
- Match the ${emotion} emotion/tone
- Include 3-5 relevant hashtags at the end
- Optimize for YouTube Shorts algorithm
- Make it shareable and engaging
- Use emojis strategically (1-2 max)

Return ONLY the caption text, no explanations or meta-commentary.`;

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
      
      // FALLBACK: Generate a simple caption based on clip data
      logger.info('Using fallback caption generation', { clipId });
      
      const emotionEmojis = {
        joy: '😊',
        excitement: '🎉',
        surprise: '😲',
        humor: '😄',
        inspiration: '✨',
        general: '🎬'
      };
      
      const emoji = emotionEmojis[emotion] || emotionEmojis.general;
      
      const fallbackCaption = `${emoji} ${clip.title}

${transcript ? transcript.substring(0, 100) + '...' : 'Check out this amazing moment!'}

#Shorts #Viral #${emotion || 'Amazing'} #MustWatch #Trending`;

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
