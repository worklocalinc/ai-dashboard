'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ModelInfo } from '@/components/model-card';

const typeColors: Record<string, string> = {
  llm: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  image: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  video: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  audio: 'bg-green-500/10 text-green-500 border-green-500/20',
  embedding: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

function formatCost(cost?: number): string {
  if (cost === undefined || cost === null) return '-';
  if (cost === 0) return 'Free';
  return `$${cost.toFixed(4)}/1M tokens`;
}

function formatContextWindow(tokens?: number): string {
  if (!tokens) return '-';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M tokens`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K tokens`;
  return `${tokens} tokens`;
}

export default function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const modelId = decodeURIComponent(resolvedParams.id);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test chat state
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function fetchModel() {
      try {
        const res = await fetch(`/api/models/${encodeURIComponent(modelId)}`);
        if (!res.ok) throw new Error('Model not found');
        const data = await res.json();
        setModel(data.model);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model');
      } finally {
        setLoading(false);
      }
    }
    fetchModel();
  }, [modelId]);

  async function handleTest() {
    if (!testPrompt.trim() || !model) return;

    setTesting(true);
    setTestResponse('');

    try {
      const res = await fetch('/api/arena/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const data = await res.json();
      setTestResponse(data.content || 'No response');
    } catch (err) {
      setTestResponse(`Error: ${err instanceof Error ? err.message : 'Request failed'}`);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="space-y-6">
        <Link href="/models">
          <Button variant="ghost" size="sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Models
          </Button>
        </Link>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Model not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/models">
          <Button variant="ghost" size="sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
      </div>

      {/* Model Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{model.name}</h1>
            <Badge
              variant="outline"
              className={cn(typeColors[model.type] || typeColors.other)}
            >
              {model.type.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono">{model.id}</p>
        </div>
        <Link href={`/arena?model=${encodeURIComponent(model.id)}`}>
          <Button>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Compare in Arena
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {model.description && (
                <p className="text-muted-foreground">{model.description}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">{model.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{model.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Context Window</p>
                  <p className="font-medium">{formatContextWindow(model.contextWindow)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                    {model.status || 'Active'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Test */}
          {model.type === 'llm' && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Test</CardTitle>
                <CardDescription>Send a test message to this model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your prompt..."
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleTest} disabled={testing || !testPrompt.trim()}>
                  {testing ? 'Sending...' : 'Send Test'}
                </Button>
                {testResponse && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium mb-2">Response:</p>
                    <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Capabilities */}
          {model.capabilities && model.capabilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {model.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pricing Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Cost per million tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Input</span>
                <span className="font-medium">{formatCost(model.inputCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Output</span>
                <span className="font-medium">{formatCost(model.outputCost)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>How to use this model</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`curl https://router.shared.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.id}",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
