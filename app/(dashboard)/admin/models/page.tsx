'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { ModelInfo } from '@/components/model-card';

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModel, setEditModel] = useState<ModelInfo | null>(null);
  const [editPricing, setEditPricing] = useState({ inputCost: '', outputCost: '' });

  async function fetchModels() {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      setModels(data.models);
    } catch (error) {
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchModels();
  }, []);

  function handleEditClick(model: ModelInfo) {
    setEditModel(model);
    setEditPricing({
      inputCost: model.inputCost?.toString() || '',
      outputCost: model.outputCost?.toString() || '',
    });
  }

  async function handleSavePricing() {
    if (!editModel) return;

    try {
      const res = await fetch(`/api/admin/models/${encodeURIComponent(editModel.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputCost: parseFloat(editPricing.inputCost) || 0,
          outputCost: parseFloat(editPricing.outputCost) || 0,
        }),
      });

      if (!res.ok) throw new Error('Failed to update model');

      toast.success('Model pricing updated');
      await fetchModels();
      setEditModel(null);
    } catch (error) {
      toast.error('Failed to update model');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Model Management</h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Model Management</h1>
        <p className="text-muted-foreground">
          Configure available models and pricing
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Models</CardDescription>
            <CardTitle className="text-3xl">{models.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LLM Models</CardDescription>
            <CardTitle className="text-3xl">
              {models.filter(m => m.type === 'llm').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Image Models</CardDescription>
            <CardTitle className="text-3xl">
              {models.filter(m => m.type === 'image').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Other Models</CardDescription>
            <CardTitle className="text-3xl">
              {models.filter(m => !['llm', 'image'].includes(m.type)).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
        <Card key={provider}>
          <CardHeader>
            <CardTitle>{provider}</CardTitle>
            <CardDescription>{providerModels.length} models</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Input Cost</TableHead>
                  <TableHead>Output Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {model.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {model.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {model.inputCost ? `$${model.inputCost}/1M` : '-'}
                    </TableCell>
                    <TableCell>
                      {model.outputCost ? `$${model.outputCost}/1M` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                        {model.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(model)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Edit Model Dialog */}
      <Dialog open={!!editModel} onOpenChange={(open) => !open && setEditModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update pricing for {editModel?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inputCost">Input Cost (per 1M tokens)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="inputCost"
                  type="number"
                  step="0.0001"
                  value={editPricing.inputCost}
                  onChange={(e) => setEditPricing({ ...editPricing, inputCost: e.target.value })}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputCost">Output Cost (per 1M tokens)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="outputCost"
                  type="number"
                  step="0.0001"
                  value={editPricing.outputCost}
                  onChange={(e) => setEditPricing({ ...editPricing, outputCost: e.target.value })}
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModel(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePricing}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
