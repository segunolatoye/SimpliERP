'use client';

import { useState } from 'react';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

type Field = { id: string; label: string; value: string };

export function AdditionalFieldsBuilder({ defaultValue = [] }: { defaultValue?: any }) {
  const [fields, setFields] = useState<Field[]>(() => {
    if (Array.isArray(defaultValue)) {
      return defaultValue.map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        label: f.label || '',
        value: f.value || ''
      }));
    }
    return [];
  });

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), label: '', value: '' }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: 'label' | 'value', val: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass state up to Server Action */}
      <input type="hidden" name="additional_fields" value={JSON.stringify(fields)} />
      
      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center mb-2 px-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Label Name</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</div>
          <div className="w-10"></div>
        </div>
      )}

      <div className="space-y-3">
        {fields.map(field => (
          <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center group">
            <Input 
              value={field.label}
              onChange={(e) => updateField(field.id, 'label', e.target.value)}
              placeholder="e.g. Tax Exemption No."
              className="premium-input bg-white/5 border-white/5 focus:bg-white/10"
            />
            <Input 
              value={field.value}
              onChange={(e) => updateField(field.id, 'value', e.target.value)}
              placeholder="e.g. 12345678"
              className="premium-input bg-white/5 border-white/5 focus:bg-white/10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeField(field.id)}
              className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 opacity-50 group-hover:opacity-100 transition-all h-10 w-10 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addField}
        className="w-full border-dashed border-white/10 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 bg-transparent h-11"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Field
      </Button>
    </div>
  );
}
