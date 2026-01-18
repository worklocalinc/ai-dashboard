import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { ModelInfo } from '@/components/model-card';

// Model registry with full information
// This can be loaded from an external config or database
const modelRegistry: Record<string, Partial<ModelInfo>> = {
  // OpenAI
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'llm',
    description: 'Most capable GPT-4 model optimized for chat and multimodal tasks',
    contextWindow: 128000,
    inputCost: 2.50,
    outputCost: 10.00,
    capabilities: ['chat', 'vision', 'function-calling', 'json-mode'],
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    type: 'llm',
    description: 'Smaller, faster, cheaper version of GPT-4o',
    contextWindow: 128000,
    inputCost: 0.15,
    outputCost: 0.60,
    capabilities: ['chat', 'vision', 'function-calling', 'json-mode'],
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    type: 'llm',
    description: 'GPT-4 Turbo with vision capabilities',
    contextWindow: 128000,
    inputCost: 10.00,
    outputCost: 30.00,
    capabilities: ['chat', 'vision', 'function-calling'],
  },
  'o1': {
    name: 'o1',
    provider: 'OpenAI',
    type: 'llm',
    description: 'Advanced reasoning model for complex tasks',
    contextWindow: 200000,
    inputCost: 15.00,
    outputCost: 60.00,
    capabilities: ['reasoning', 'chat'],
  },
  'o1-mini': {
    name: 'o1 Mini',
    provider: 'OpenAI',
    type: 'llm',
    description: 'Faster reasoning model for simpler tasks',
    contextWindow: 128000,
    inputCost: 3.00,
    outputCost: 12.00,
    capabilities: ['reasoning', 'chat'],
  },
  'o3-mini': {
    name: 'o3 Mini',
    provider: 'OpenAI',
    type: 'llm',
    description: 'Latest reasoning model with improved performance',
    contextWindow: 200000,
    inputCost: 1.10,
    outputCost: 4.40,
    capabilities: ['reasoning', 'chat'],
    status: 'beta',
  },

  // Anthropic
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'llm',
    description: 'Best balance of intelligence and speed',
    contextWindow: 200000,
    inputCost: 3.00,
    outputCost: 15.00,
    capabilities: ['chat', 'vision', 'tool-use', 'computer-use'],
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    type: 'llm',
    description: 'Fastest Claude model for quick tasks',
    contextWindow: 200000,
    inputCost: 0.80,
    outputCost: 4.00,
    capabilities: ['chat', 'vision', 'tool-use'],
  },
  'claude-opus-4-20250514': {
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    type: 'llm',
    description: 'Most intelligent Claude model for complex tasks',
    contextWindow: 200000,
    inputCost: 15.00,
    outputCost: 75.00,
    capabilities: ['chat', 'vision', 'tool-use', 'extended-thinking'],
  },
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    type: 'llm',
    description: 'Latest Sonnet with enhanced capabilities',
    contextWindow: 200000,
    inputCost: 3.00,
    outputCost: 15.00,
    capabilities: ['chat', 'vision', 'tool-use', 'extended-thinking'],
  },

  // Google
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    type: 'llm',
    description: 'Fast and efficient Gemini model',
    contextWindow: 1000000,
    inputCost: 0.10,
    outputCost: 0.40,
    capabilities: ['chat', 'vision', 'function-calling'],
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    type: 'llm',
    description: 'Most capable Gemini model with deep thinking',
    contextWindow: 1000000,
    inputCost: 1.25,
    outputCost: 10.00,
    capabilities: ['chat', 'vision', 'function-calling', 'deep-thinking'],
  },

  // DeepSeek
  'deepseek-chat': {
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    type: 'llm',
    description: 'Powerful open-weight model',
    contextWindow: 64000,
    inputCost: 0.14,
    outputCost: 0.28,
    capabilities: ['chat', 'function-calling'],
  },
  'deepseek-reasoner': {
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    type: 'llm',
    description: 'Advanced reasoning model',
    contextWindow: 64000,
    inputCost: 0.55,
    outputCost: 2.19,
    capabilities: ['reasoning', 'chat'],
  },

  // xAI
  'grok-3': {
    name: 'Grok 3',
    provider: 'xAI',
    type: 'llm',
    description: 'Latest Grok model with enhanced capabilities',
    contextWindow: 131072,
    inputCost: 3.00,
    outputCost: 15.00,
    capabilities: ['chat', 'vision', 'function-calling'],
  },
  'grok-3-mini': {
    name: 'Grok 3 Mini',
    provider: 'xAI',
    type: 'llm',
    description: 'Smaller Grok for faster responses',
    contextWindow: 131072,
    inputCost: 0.30,
    outputCost: 0.50,
    capabilities: ['chat', 'function-calling'],
  },

  // Image Models
  'dall-e-3': {
    name: 'DALL-E 3',
    provider: 'OpenAI',
    type: 'image',
    description: 'High-quality image generation',
    capabilities: ['text-to-image'],
  },
  'flux-1.1-pro': {
    name: 'FLUX 1.1 Pro',
    provider: 'Black Forest Labs',
    type: 'image',
    description: 'State-of-the-art image generation',
    capabilities: ['text-to-image', 'high-resolution'],
  },
  'ideogram-v2': {
    name: 'Ideogram V2',
    provider: 'Replicate',
    type: 'image',
    description: 'Excellent for text rendering in images',
    capabilities: ['text-to-image', 'text-rendering'],
  },

  // Video Models
  'minimax-video': {
    name: 'MiniMax Video',
    provider: 'MiniMax',
    type: 'video',
    description: 'Video generation from text',
    capabilities: ['text-to-video'],
  },
  'kling-v1': {
    name: 'Kling V1',
    provider: 'Kuaishou',
    type: 'video',
    description: 'High-quality video generation',
    capabilities: ['text-to-video', 'image-to-video'],
  },

  // Audio Models
  'whisper-large-v3': {
    name: 'Whisper Large V3',
    provider: 'OpenAI',
    type: 'audio',
    description: 'Speech to text transcription',
    capabilities: ['speech-to-text', 'translation'],
  },
  'tts-1-hd': {
    name: 'TTS-1 HD',
    provider: 'OpenAI',
    type: 'audio',
    description: 'High-quality text to speech',
    capabilities: ['text-to-speech'],
  },

  // Embeddings
  'text-embedding-3-large': {
    name: 'Text Embedding 3 Large',
    provider: 'OpenAI',
    type: 'embedding',
    description: 'High-quality text embeddings',
    inputCost: 0.13,
    capabilities: ['embeddings'],
  },
  'voyage-3': {
    name: 'Voyage 3',
    provider: 'Voyage',
    type: 'embedding',
    description: 'State-of-the-art embeddings for RAG',
    inputCost: 0.06,
    capabilities: ['embeddings', 'reranking'],
  },
};

async function fetchLiteLLMModels(): Promise<string[]> {
  try {
    const res = await fetch(`${process.env.LITELLM_URL}/model/info`, {
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_MASTER_KEY}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error('Failed to fetch from LiteLLM:', res.status);
      return [];
    }

    const data = await res.json();
    return data.data?.map((m: { model_name: string }) => m.model_name) || [];
  } catch (error) {
    console.error('Error fetching LiteLLM models:', error);
    return [];
  }
}

export async function GET() {
  const session = await auth();

  if (!session || session.user.role === 'pending') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch available models from LiteLLM
    const availableModels = await fetchLiteLLMModels();

    // Build model list with registry info
    const models: ModelInfo[] = [];

    for (const modelId of availableModels) {
      const registryInfo = modelRegistry[modelId] || {};

      models.push({
        id: modelId,
        name: registryInfo.name || modelId,
        provider: registryInfo.provider || 'Unknown',
        type: registryInfo.type || 'llm',
        description: registryInfo.description,
        contextWindow: registryInfo.contextWindow,
        inputCost: registryInfo.inputCost,
        outputCost: registryInfo.outputCost,
        status: registryInfo.status || 'active',
        capabilities: registryInfo.capabilities,
      });
    }

    // If no models from LiteLLM, return registry models as fallback
    if (models.length === 0) {
      for (const [id, info] of Object.entries(modelRegistry)) {
        models.push({
          id,
          name: info.name || id,
          provider: info.provider || 'Unknown',
          type: info.type || 'llm',
          description: info.description,
          contextWindow: info.contextWindow,
          inputCost: info.inputCost,
          outputCost: info.outputCost,
          status: info.status || 'active',
          capabilities: info.capabilities,
        });
      }
    }

    // Sort by provider, then name
    models.sort((a, b) => {
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error in models API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
