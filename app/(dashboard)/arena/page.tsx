'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArenaChat } from '@/components/arena-chat';
import { toast } from 'sonner';
import type { ModelInfo } from '@/components/model-card';

interface ArenaResponse {
  model: string;
  content: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
}

function ArenaContent() {
  const searchParams = useSearchParams();
  const preselectedModel = searchParams.get('model');

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelA, setModelA] = useState<string>('');
  const [modelB, setModelB] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<ArenaResponse[]>([]);
  const [voted, setVoted] = useState(false);
  const [winner, setWinner] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error('Failed to fetch models');
        const data = await res.json();
        // Only show LLM models in arena
        const llmModels = data.models.filter((m: ModelInfo) => m.type === 'llm');
        setModels(llmModels);

        // Set preselected model
        if (preselectedModel && llmModels.some((m: ModelInfo) => m.id === preselectedModel)) {
          setModelA(preselectedModel);
        }
      } catch (error) {
        toast.error('Failed to load models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, [preselectedModel]);

  function shuffleModels() {
    if (models.length < 2) return;
    const shuffled = [...models].sort(() => Math.random() - 0.5);
    setModelA(shuffled[0].id);
    setModelB(shuffled[1].id);
  }

  async function startComparison() {
    if (!modelA || !modelB || !prompt.trim()) {
      toast.error('Please select two models and enter a prompt');
      return;
    }

    if (modelA === modelB) {
      toast.error('Please select two different models');
      return;
    }

    // Reset state
    setVoted(false);
    setWinner(undefined);
    setSessionId(null);

    // Initialize responses
    setResponses([
      { model: modelA, content: '', loading: true },
      { model: modelB, content: '', loading: true },
    ]);

    // Start both requests
    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: [modelA, modelB],
          prompt: prompt.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to start comparison');

      const data = await res.json();
      setSessionId(data.sessionId);

      // Update responses
      setResponses([
        {
          model: modelA,
          content: data.responses[modelA]?.content || '',
          loading: false,
          error: data.responses[modelA]?.error,
          latencyMs: data.responses[modelA]?.latencyMs,
        },
        {
          model: modelB,
          content: data.responses[modelB]?.content || '',
          loading: false,
          error: data.responses[modelB]?.error,
          latencyMs: data.responses[modelB]?.latencyMs,
        },
      ]);
    } catch (error) {
      toast.error('Failed to get responses');
      setResponses([
        { model: modelA, content: '', loading: false, error: 'Request failed' },
        { model: modelB, content: '', loading: false, error: 'Request failed' },
      ]);
    }
  }

  async function handleVote(winnerModel: string) {
    if (!sessionId) return;

    setWinner(winnerModel);
    setVoted(true);

    try {
      await fetch('/api/arena/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          winner: winnerModel,
        }),
      });
      toast.success('Vote recorded!');
    } catch (error) {
      toast.error('Failed to record vote');
    }
  }

  function reset() {
    setResponses([]);
    setVoted(false);
    setWinner(undefined);
    setSessionId(null);
    setPrompt('');
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Model Arena</h1>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Model Arena</h1>
          <p className="text-muted-foreground">
            Compare responses from different AI models side by side
          </p>
        </div>
        {responses.length > 0 && (
          <Button variant="outline" onClick={reset}>
            New Comparison
          </Button>
        )}
      </div>

      {responses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Start a Comparison</CardTitle>
            <CardDescription>
              Select two models and enter a prompt to see how they respond
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Model A</label>
                <Select value={modelA} onValueChange={setModelA}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {model.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model B</label>
                <Select value={modelB} onValueChange={setModelB}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {model.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" onClick={shuffleModels} className="w-full sm:w-auto">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Random Models
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Prompt</label>
              <Textarea
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={startComparison}
              disabled={!modelA || !modelB || !prompt.trim()}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Comparison
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Show prompt */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{prompt}</p>
            </CardContent>
          </Card>

          {/* Responses */}
          <ArenaChat
            responses={responses}
            onVote={handleVote}
            voted={voted}
            winner={winner}
          />

          {voted && (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Thanks for voting! Your feedback helps improve our model rankings.
              </p>
              <Button onClick={reset}>
                Start New Comparison
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Model Arena</h1>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    }>
      <ArenaContent />
    </Suspense>
  );
}
