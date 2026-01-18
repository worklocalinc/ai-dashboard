'use client';

import { useState, useEffect } from 'react';
import { ModelCard, ModelInfo } from '@/components/model-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const modelTypes = ['all', 'llm', 'image', 'video', 'audio', 'embedding'] as const;
type ModelType = typeof modelTypes[number];

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<ModelType>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error('Failed to fetch models');
        const data = await res.json();
        setModels(data.models);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  // Get unique providers
  const providers = ['all', ...Array.from(new Set(models.map(m => m.provider)))].sort();

  // Filter models
  const filteredModels = models.filter(model => {
    const matchesSearch = search === '' ||
      model.name.toLowerCase().includes(search.toLowerCase()) ||
      model.id.toLowerCase().includes(search.toLowerCase()) ||
      model.provider.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || model.type === selectedType;
    const matchesProvider = selectedProvider === 'all' || model.provider === selectedProvider;
    return matchesSearch && matchesType && matchesProvider;
  });

  // Group by type for stats
  const typeStats = models.reduce((acc, model) => {
    acc[model.type] = (acc[model.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Models</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Models</h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground">
            Browse {models.length} available AI models
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {modelTypes.slice(1).map((type) => (
          <div
            key={type}
            className={cn(
              'rounded-lg border p-4 cursor-pointer transition-colors',
              selectedType === type ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            )}
            onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
          >
            <p className="text-2xl font-bold">{typeStats[type] || 0}</p>
            <p className="text-sm text-muted-foreground capitalize">{type} Models</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {modelTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="capitalize"
            >
              {type === 'all' ? 'All Types' : type}
            </Button>
          ))}
        </div>
      </div>

      {/* Provider filter */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground self-center">Provider:</span>
        {providers.map((provider) => (
          <Badge
            key={provider}
            variant={selectedProvider === provider ? 'default' : 'outline'}
            className="cursor-pointer capitalize"
            onClick={() => setSelectedProvider(provider)}
          >
            {provider === 'all' ? 'All' : provider}
          </Badge>
        ))}
      </div>

      {/* Model Grid */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No models found matching your filters.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearch('');
              setSelectedType('all');
              setSelectedProvider('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
