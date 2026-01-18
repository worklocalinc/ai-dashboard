'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  type: 'llm' | 'image' | 'video' | 'audio' | 'embedding' | 'other';
  contextWindow?: number;
  inputCost?: number;  // per 1M tokens in dollars
  outputCost?: number; // per 1M tokens in dollars
  status?: 'active' | 'deprecated' | 'beta';
  capabilities?: string[];
}

const typeColors: Record<string, string> = {
  llm: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  image: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  video: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  audio: 'bg-green-500/10 text-green-500 border-green-500/20',
  embedding: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const providerColors: Record<string, string> = {
  openai: 'bg-emerald-500/10 text-emerald-600',
  anthropic: 'bg-orange-500/10 text-orange-600',
  google: 'bg-blue-500/10 text-blue-600',
  'google-vertex': 'bg-blue-500/10 text-blue-600',
  meta: 'bg-blue-600/10 text-blue-700',
  mistral: 'bg-indigo-500/10 text-indigo-600',
  xai: 'bg-gray-500/10 text-gray-600',
  together: 'bg-cyan-500/10 text-cyan-600',
  groq: 'bg-red-500/10 text-red-600',
  replicate: 'bg-violet-500/10 text-violet-600',
  'black-forest-labs': 'bg-amber-500/10 text-amber-600',
  deepseek: 'bg-teal-500/10 text-teal-600',
};

function formatCost(cost?: number): string {
  if (cost === undefined || cost === null) return '-';
  if (cost === 0) return 'Free';
  if (cost < 0.01) return `$${(cost * 1000).toFixed(2)}/1K`;
  return `$${cost.toFixed(2)}/1M`;
}

function formatContextWindow(tokens?: number): string {
  if (!tokens) return '-';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
}

export function ModelCard({ model }: { model: ModelInfo }) {
  return (
    <Link href={`/models/${encodeURIComponent(model.id)}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{model.name}</CardTitle>
              <CardDescription className="truncate">
                {model.id}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn('shrink-0', typeColors[model.type] || typeColors.other)}
            >
              {model.type.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('text-xs', providerColors[model.provider.toLowerCase()] || 'bg-muted')}
            >
              {model.provider}
            </Badge>
            {model.status === 'beta' && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                Beta
              </Badge>
            )}
            {model.status === 'deprecated' && (
              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                Deprecated
              </Badge>
            )}
          </div>

          {model.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {model.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Context</p>
              <p className="font-medium">{formatContextWindow(model.contextWindow)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Input</p>
              <p className="font-medium">{formatCost(model.inputCost)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Output</p>
              <p className="font-medium">{formatCost(model.outputCost)}</p>
            </div>
          </div>

          {model.capabilities && model.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {model.capabilities.slice(0, 3).map((cap) => (
                <Badge key={cap} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))}
              {model.capabilities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{model.capabilities.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
