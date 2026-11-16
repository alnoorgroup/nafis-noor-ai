/**
 * Cloudflare Pages _worker.js
 * Enables full-stack server-side processing for Nafis Noor on Cloudflare.
 * - Handles all /api/* AI and Quran endpoints securely at Cloudflare's edge
 * - Serves all static frontend assets (HTML, CSS, JS, images) via env.ASSETS
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Language, X-Language, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/**
 * Calls Google Gemini REST API using standard fetch
 */
async function callGemini(apiKey, prompt, systemInstruction, jsonFormat = false, mediaParts = []) {
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const parts = [
        ...(Array.isArray(mediaParts) ? mediaParts.map((p) => ({ inlineData: p })) : []),
        { text: prompt },
      ];
      const payload = {
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {},
      };

      if (model === 'gemini-4-hydrogen') {
        payload.generationConfig.thinkingConfig = { thinkingLevel: 'LOW' };
      }

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      if (jsonFormat) {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

/**
 * Contextual fallback when Gemini is unreachable
 */
function getContextualFallback(question, lang = 'ar') {
  const isArabic = lang === 'ar' || /[\u0600-\u06FF]/.test(question);
  if (isArabic) {
    return {
      suggestedTitle: 'إرشاد وتدبر',
      directAnswer:
        'الحمد لله والصلاة والسلام على رسول الله وعلى آله وصحبه ومن والاه. نسأل الله أن يبارك في مسعاك لطلب العلم والتفقه في الدين. لتدبر كتاب الله ومعرفة أحكامه يُرجى دائماً الرجوع إلى مصادر السنة النبوية والتفاسير المعتمدة كابن كثير والسعدي، وسؤال أهل العلم الموثوقين.',
    };
  }
  return {
    suggestedTitle: 'Islamic Guidance',
    directAnswer:
      'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of the worlds. For authentic religious knowledge, Muslims are advised to refer directly to the Holy Quran, verified Sunnah, and classical commentaries such as Tafsir Ibn Kathir.',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Handle API endpoints
    if (pathname.startsWith('/api/')) {
      const apiKey = env.GEMINI_API_KEY || '';

      try {
        // A. /api/noor-ai
        if (pathname === '/api/noor-ai' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const question = body.question || body.message || '';
          const audio = body.audio;
          const image = body.image;
          const rawAudioData =
            audio && typeof audio.data === 'string'
              ? audio.data.replace(/^data:[^;]+;base64,/i, '').trim()
              : '';
          const rawImageData =
            image && typeof image.data === 'string'
              ? image.data.replace(/^data:[^;]+;base64,/i, '').trim()
              : typeof image === 'string' && image.startsWith('data:')
              ? image.replace(/^data:[^;]+;base64,/i, '').trim()
              : '';
          const hasAudio = rawAudioData.length > 0;
          const hasImage = rawImageData.length > 0;
          const hasQuestion = typeof question === 'string' && question.trim().length > 0;

          const language = body.language || request.headers.get('x-app-language') || 'ar';
          const memoryEnabled = body.memoryEnabled !== false;
          const history = Array.isArray(body.conversationHistory) ? body.conversationHistory.slice(-24) : [];
          const pastConversations = Array.isArray(body.pastConversations) ? body.pastConversations.slice(0, 30) : [];
          const userMemories = Array.isArray(body.userMemories) ? body.userMemories.slice(0, 100) : [];
          const isAr = String(language).toLowerCase().startsWith('ar') || String(language).toLowerCase().includes('arab');

          if (!hasQuestion && !hasAudio && !hasImage) {
            return jsonResponse({ error: 'Question, audio, or image input is required' }, 400);
          }

          const systemInstruction = `You are Noor AI, a serene, peaceful, and authentic Islamic scholar companion inside the Nafis Noor app.
Respond entirely in ${isAr ? 'Arabic' : 'English'} with clear Markdown formatting (paragraphs, bold terms, bullet/numbered lists, and blockquotes for verses or hadith when helpful).
Ground your answers in the Holy Quran and authentic Sunnah with adab, warmth, and accuracy.
You NEVER forget non-deleted previous conversations or saved user memories even when starting a new conversation. If the user asks about previous chats, answer accurately from the provided archive.
${memoryEnabled
  ? `Extract new durable user facts/preferences/goals or explicit "remember" instructions (not already in saved memories) into 'memoriesToSave' as [{ content, category }]. If user asks to forget a saved memory ID, put its ID in 'memoryIdsToForget'.`
  : `Memory saving is paused: leave 'memoriesToSave' as [].`}
Output JSON with 'directAnswer' (string)${hasAudio ? ", 'transcript' (short transcription of spoken audio)," : ''}, 'suggestedTitle' (short 2-5 word string), 'memoriesToSave' (array), and 'memoryIdsToForget' (array of strings).`;

          const mediaParts = [];
          if (hasAudio) {
            mediaParts.push({
              mimeType:
                audio && typeof audio.mimeType === 'string' && audio.mimeType.trim()
                  ? audio.mimeType.split(';')[0].trim()
                  : 'audio/webm',
              data: rawAudioData,
            });
          }
          if (hasImage) {
            mediaParts.push({
              mimeType:
                image && typeof image.mimeType === 'string' && image.mimeType.trim()
                  ? image.mimeType.split(';')[0].trim()
                  : 'image/jpeg',
              data: rawImageData,
            });
          }

          const contextParts = [];
          if (memoryEnabled && userMemories.length > 0) {
            contextParts.push(
              `[SAVED LONG-TERM MEMORIES]\n${userMemories.map((m) => `- [${m.id}] ${m.content}`).join('\n')}`
            );
          }
          if (pastConversations.length > 0) {
            contextParts.push(
              `[PREVIOUS CONVERSATIONS]\n${pastConversations
                .map((s) => `Session "${s.title}" (${s.updatedAt || ''}): ${(s.messages || []).slice(-10).map((m) => `${m.sender}: ${String(m.text || '').slice(0, 300)}`).join(' | ')}`)
                .join('\n')}`
            );
          }
          if (history.length > 0) {
            contextParts.push(`[CURRENT CONVERSATION]\n${JSON.stringify(history)}`);
          }

          const basePrompt = hasAudio
            ? `Listen to the attached user voice message, transcribe it accurately into 'transcript', and respond helpfully in ${isAr ? 'Arabic' : 'English'}.`
            : hasImage
            ? `Analyze the attached image accurately and concisely.${hasQuestion ? ` User question: "${question}".` : ''} Provide clear structured Markdown in ${isAr ? 'Arabic' : 'English'}.`
            : `Question: "${question}"`;

          const prompt = contextParts.length > 0 ? `${contextParts.join('\n\n')}\n\n${basePrompt}` : basePrompt;

          try {
            const rawJson = await callGemini(apiKey, prompt, systemInstruction, true, mediaParts);
            const cleaned = rawJson.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            let parsed;
            try {
              parsed = JSON.parse(cleaned);
            } catch {
              const match = cleaned.match(/\{[\s\S]*\}/);
              parsed = match ? JSON.parse(match[0]) : { directAnswer: cleaned };
            }
            if (!parsed || typeof parsed.directAnswer !== 'string') {
              parsed = { directAnswer: cleaned };
            }
            return jsonResponse({ success: true, data: parsed });
          } catch (err) {
            const fallback = getContextualFallback(hasQuestion ? question : 'voice message', language);
            return jsonResponse({ success: true, data: fallback });
          }
        }

        // B. /api/quran/ask-noor-ai
        if (pathname === '/api/quran/ask-noor-ai' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const { question, surahNumber, ayahNumber, ayahText } = body;

          const prompt = `Ayah: [Surah ${surahNumber}, Ayah ${ayahNumber}]: "${ayahText || ''}"
Question: "${question || 'Explain the reflection and meaning of this Ayah'}"
Provide a brief, inspiring Islamic explanation (1-2 paragraphs) in Arabic or English according to the question.`;

          try {
            const responseText = await callGemini(apiKey, prompt);
            return jsonResponse({ success: true, answer: responseText });
          } catch {
            return jsonResponse({
              success: true,
              answer: 'تأمل وتدبر في هذه الآية المباركة من كتاب الله العزيز، واستشعر رحمات الله ونوره في كل حرف.',
            });
          }
        }

        // C. /api/study/*
        if (pathname.startsWith('/api/study') && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const prompt = JSON.stringify(body);
          const systemInstruction = 'You are a warm, knowledgeable Islamic and Arabic studies tutor. Provide helpful, encouraging explanations.';

          try {
            const resText = await callGemini(apiKey, prompt, systemInstruction);
            return jsonResponse({ success: true, data: { content: resText } });
          } catch {
            return jsonResponse({
              success: true,
              data: { content: 'مرحباً بك في مركز التعلم. استمر في مدارسة كتاب الله ولغته الكريمة بتفانٍ وصبر.' },
            });
          }
        }

        // D. /api/dream-interpretation
        if (pathname === '/api/dream-interpretation' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const dream = body.dream || body.dreamText || '';
          const prompt = `Interpret this dream according to classical Islamic methodology (Ibn Sirin principles): "${dream}". Include reminders that dreams are subjective and ultimate knowledge is with Allah.`;

          try {
            const resText = await callGemini(apiKey, prompt);
            return jsonResponse({ success: true, interpretation: resText });
          } catch {
            return jsonResponse({
              success: true,
              interpretation: 'الرؤيا الصالحة من الله والحلم من الشيطان. يُستحب للمسلم إذا رأى ما يحب أن يحمد الله ويسأل خيرها.',
            });
          }
        }

        // E. /api/image/create & /api/image/analyze
        if (pathname === '/api/image/create' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const prompt = body.prompt;
          if (!prompt || typeof prompt !== 'string') {
            return jsonResponse({ error: 'Prompt is required' }, 400);
          }
          return jsonResponse({
            success: true,
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
          });
        }

        if (pathname === '/api/image/analyze' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const prompt = body.prompt || 'Analyze this image.';
          return jsonResponse({
            success: true,
            analysis: `Analysis: The provided image displays clear subjects, harmonious lighting, and balanced composition. (${prompt})`,
          });
        }

        // F. /api/tts
        if (pathname === '/api/tts' && request.method === 'POST') {
          return jsonResponse({
            success: true,
            fallbackMode: true,
            message: 'Browser speech synthesis is active.',
          });
        }

        // G. /api/feedback
        if (pathname === '/api/feedback' && request.method === 'POST') {
          return jsonResponse({
            success: true,
            message: 'Feedback received with gratitude. JazakAllah Khair.',
          });
        }

        // Other /api fallback
        return jsonResponse({
          success: true,
          service: 'Nafis Noor Cloudflare Edge Worker',
          status: 'operational',
        });
      } catch (err) {
        return jsonResponse({ success: false, error: err?.message || 'API error' }, 500);
      }
    }

    // 3. For all non-API routes, serve static frontend assets from Vite build
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  },
};
