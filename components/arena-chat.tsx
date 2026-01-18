'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ArenaResponse {
  model: string;
  content: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
}

interface ArenaChatProps {
  responses: ArenaResponse[];
  onVote: (model: string) => void;
  voted: boolean;
  winner?: string;
}

export function ArenaChat({ responses, onVote, voted, winner }: ArenaChatProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {responses.map((response, index) => (
        <Card
          key={response.model}
          className={cn(
            'transition-all',
            voted && winner === response.model && 'ring-2 ring-primary',
            voted && winner !== response.model && 'opacity-60'
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {voted ? response.model : `Model ${String.fromCharCode(65 + index)}`}
                {response.loading && (
                  <span className="animate-pulse text-muted-foreground">...</span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {response.latencyMs && (
                  <Badge variant="secondary" className="text-xs">
                    {response.latencyMs}ms
                  </Badge>
                )}
                {voted && winner === response.model && (
                  <Badge className="bg-primary text-primary-foreground">
                    Winner
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {response.loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                </div>
              ) : response.error ? (
                <p className="text-destructive">{response.error}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm">{response.content}</p>
                </div>
              )}
            </ScrollArea>
            {!voted && !response.loading && response.content && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => onVote(response.model)}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Vote for this response
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
