const LITELLM_URL = process.env.LITELLM_URL || 'https://ai.shared.com';
const LITELLM_KEY = process.env.LITELLM_MASTER_KEY || '';

interface LiteLLMKey {
  key: string;
  key_name: string;
  user_id: string;
  expires: string | null;
}

interface LiteLLMModel {
  model_name: string;
  litellm_params: {
    model: string;
    api_base?: string;
    api_key?: string;
  };
  model_info?: {
    id: string;
    mode?: string;
    input_cost_per_token?: number;
    output_cost_per_token?: number;
    max_tokens?: number;
    base_model?: string;
  };
}

interface SpendLog {
  request_id: string;
  call_type: string;
  api_key: string;
  spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  startTime: string;
  endTime: string;
  model: string;
  user: string;
  metadata: Record<string, unknown>;
  cache_hit: string;
  cache_key: string;
  request_tags: string[];
}

async function litellmFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${LITELLM_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${LITELLM_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LiteLLM API error: ${res.status} - ${error}`);
  }

  return res.json();
}

export async function generateApiKey(
  userId: string,
  keyAlias: string,
  options?: {
    duration?: string;
    models?: string[];
    maxBudget?: number;
    rpmLimit?: number;
  }
): Promise<{ key: string; token: string; key_name: string }> {
  const body: Record<string, unknown> = {
    user_id: userId,
    key_alias: keyAlias,
  };

  if (options?.duration) body.duration = options.duration;
  if (options?.models) body.models = options.models;
  if (options?.maxBudget) body.max_budget = options.maxBudget;
  if (options?.rpmLimit) body.rpm_limit = options.rpmLimit;

  return litellmFetch('/key/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function deleteApiKey(key: string): Promise<{ deleted: boolean }> {
  return litellmFetch('/key/delete', {
    method: 'POST',
    body: JSON.stringify({ keys: [key] }),
  });
}

export async function listApiKeys(userId?: string): Promise<{ keys: LiteLLMKey[] }> {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);

  return litellmFetch(`/key/list?${params}`);
}

export async function getKeyInfo(key: string): Promise<LiteLLMKey> {
  return litellmFetch('/key/info', {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}

export async function getSpendLogs(options?: {
  userId?: string;
  apiKey?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<SpendLog[]> {
  const params = new URLSearchParams();
  if (options?.userId) params.set('user_id', options.userId);
  if (options?.apiKey) params.set('api_key', options.apiKey);
  if (options?.startDate) params.set('start_date', options.startDate.toISOString());
  if (options?.endDate) params.set('end_date', options.endDate.toISOString());

  return litellmFetch(`/spend/logs?${params}`);
}

export async function getSpendByUser(userId: string): Promise<{ spend: number }> {
  return litellmFetch(`/spend/user?user_id=${userId}`);
}

export async function listModels(): Promise<{ data: LiteLLMModel[] }> {
  return litellmFetch('/model/info');
}

export async function getModelInfo(modelName: string): Promise<LiteLLMModel> {
  return litellmFetch(`/model/info?model=${modelName}`);
}

export async function chatCompletion(
  model: string,
  messages: { role: string; content: string }[],
  options?: {
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{
  id: string;
  choices: { message: { role: string; content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}> {
  const headers: Record<string, string> = {};
  if (options?.apiKey) {
    headers['Authorization'] = `Bearer ${options.apiKey}`;
  } else {
    headers['Authorization'] = `Bearer ${LITELLM_KEY}`;
  }

  const body: Record<string, unknown> = {
    model,
    messages,
  };

  if (options?.maxTokens) body.max_tokens = options.maxTokens;
  if (options?.temperature !== undefined) body.temperature = options.temperature;

  const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Chat completion error: ${res.status} - ${error}`);
  }

  return res.json();
}

export async function streamChatCompletion(
  model: string,
  messages: { role: string; content: string }[],
  options?: {
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ReadableStream> {
  const headers: Record<string, string> = {};
  if (options?.apiKey) {
    headers['Authorization'] = `Bearer ${options.apiKey}`;
  } else {
    headers['Authorization'] = `Bearer ${LITELLM_KEY}`;
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
  };

  if (options?.maxTokens) body.max_tokens = options.maxTokens;
  if (options?.temperature !== undefined) body.temperature = options.temperature;

  const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Stream completion error: ${res.status} - ${error}`);
  }

  return res.body!;
}
