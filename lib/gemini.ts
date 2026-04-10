import { GoogleGenAI, Type, Modality } from "@google/genai";

export async function generateDirectorPlan(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following vibe/prompt for a music track and generate an ASMR director plan.
    
    Prompt: "${prompt}"
    
    Identify rhythmic peaks, musical phrase boundaries, note energy, recommended ASMR category, panning direction, and intensity.
    Return a JSON array of sound events.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: {
              type: Type.NUMBER,
              description: "Timestamp in seconds (e.g., 0.5, 1.2)",
            },
            soundType: {
              type: Type.STRING,
              description: "Type of ASMR sound (e.g., 'tap', 'scratch', 'crinkle', 'glass', 'softclick')",
            },
            panning: {
              type: Type.STRING,
              description: "Panning direction ('left', 'right', 'center')",
            },
            intensity: {
              type: Type.STRING,
              description: "Intensity of the sound ('soft', 'medium', 'loud')",
            },
            noteLabel: {
              type: Type.STRING,
              description: "Optional musical note or feeling (e.g., 'high energy peak', 'phrase boundary')",
            },
          },
          required: ["timestamp", "soundType", "panning", "intensity"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
  }
  return [];
}

export async function generateAudioTrack(prompt: string, style: string, tempo: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const ttsPrompt = `Whisper softly and slowly like an ASMR artist: "Welcome to your ASMR journey. You requested ${prompt}. Relax, breathe, and let go. Feel the tingles. Everything is peaceful."`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio generated");
  }

  // Convert raw PCM (16-bit, 24kHz, mono) to WAV
  const binaryString = atob(base64Audio);
  const pcmLength = binaryString.length;
  const wavBuffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1)
  view.setUint32(24, 24000, true); // SampleRate (24kHz)
  view.setUint32(28, 24000 * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, pcmLength, true);

  const pcmBytes = new Uint8Array(wavBuffer, 44);
  for (let i = 0; i < pcmLength; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
