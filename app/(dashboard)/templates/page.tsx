'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService, DocumentTemplate, DOCUMENT_TYPE_LABELS, DocumentType } from '@/services/templateService';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { TemplateEditorModal } from '@/components/templates/TemplateEditorModal';
import { DocumentViewerModal } from '@/components/templates/DocumentViewerModal';
import {
  FileText, Plus, Copy, Edit2, Trash2, Eye, Star, CheckCircle, ShieldAlert,
  Printer, Download, Smartphone, Layers, Search, Sparkles, Filter, Check,
} from 'lucide-react';

export default function DocumentTemplatesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { isOwner, isPlatformOwner } = useBranding();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [viewingTemplate, setViewingTemplate] = useState<DocumentTemplate | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['documentTemplates', user?.supermarket_id],
    queryFn: () => templateService.getTemplates(user?.supermarket_id),
  });

  const saveMutation = useMutation({
    mutationFn: (updated: Partial<DocumentTemplate>) => templateService.saveTemplate(updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTemplates'] });
      toast.success('Template Saved', 'Document template configuration saved successfully.');
    },
    onError: (err: any) => {
      toast.error('Save Failed', err.message || 'Could not save template.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id, user?.supermarket_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTemplates'] });
      toast.success('Template Deleted', 'Custom template was removed.');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err.message || 'Could not delete template.');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => templateService.duplicateTemplate(id, user?.supermarket_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTemplates'] });
      toast.success('Template Duplicated', 'Created a duplicate copy of the selected template.');
    },
    onError: (err: any) => {
      toast.error('Duplicate Failed', err.message || 'Could not duplicate template.');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: DocumentType }) =>
      templateService.setDefaultTemplate(id, type, user?.supermarket_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTemplates'] });
      toast.success('Default Template Set', 'Updated default template for this document category.');
    },
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedType === 'ALL' || t.type === selectedType;
      return matchSearch && matchType;
    });
  }, [templates, search, selectedType]);

  const handleCreateNew = () => {
    const defaultNew: Partial<DocumentTemplate> = {
      name: 'Custom Receipt Template',
      type: 'sales_receipt',
      paper_size: '80mm',
      orientation: 'portrait',
      font_family: 'monospace',
      font_size: 'medium',
      primary_color: '#0f172a',
      accent_color: '#10b981',
      show_logo: true,
      show_qr: true,
      show_barcode: true,
      show_watermark: false,
      show_signature: false,
      show_stamp: false,
      header_message: 'Welcome to our supermarket',
      footer_message: 'Thank you for shopping with us.',
      thank_you_message: 'Thank you!',
      return_policy: 'Goods returnable within 7 days with valid receipt.',
    };
    setEditingTemplate(defaultNew as DocumentTemplate);
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Document & Receipt Template Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Customize sales receipts, tax invoices, quotations, purchase orders, and delivery notes
          </p>
        </div>

        {isOwner && (
          <Button onClick={handleCreateNew} variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" /> Create Custom Template
          </Button>
        )}
      </div>

      {isPlatformOwner && (
        <Card className="border-l-4 border-l-blue-600 bg-blue-50/40 p-4">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Platform Admin View Mode</h4>
              <p className="text-xs text-blue-700 mt-0.5 font-medium">
                You are viewing platform default document templates. Individual supermarket owners manage their isolated templates.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name..."
            className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto custom-scrollbar">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
          >
            <option value="ALL">All Document Types ({templates.length})</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-black text-slate-700">No document templates found</h3>
          <p className="text-xs text-slate-400 mt-1">No template matches your filter criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tmpl) => (
            <Card key={tmpl.id} className="p-5 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-4 shadow-sm bg-white">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-slate-900 line-clamp-1">{tmpl.name}</h3>
                      {tmpl.is_default && (
                        <Badge variant="success" className="text-[9px] px-1.5 py-0 flex items-center space-x-0.5">
                          <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{DOCUMENT_TYPE_LABELS[tmpl.type]}</p>
                  </div>
                  {tmpl.is_system && <Badge variant="info">System</Badge>}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Paper Size:</span>
                    <span className="font-bold text-slate-900 uppercase">{tmpl.paper_size}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Typography:</span>
                    <span className="font-bold text-slate-900">{tmpl.font_family} ({tmpl.font_size})</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Elements:</span>
                    <span className="font-bold text-slate-900">
                      {[tmpl.show_logo && 'Logo', tmpl.show_qr && 'QR', tmpl.show_barcode && 'Barcode', tmpl.show_stamp && 'Stamp'].filter(Boolean).join(', ') || 'Standard'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingTemplate(tmpl);
                      setIsViewerOpen(true);
                    }}
                    className="flex-1 text-xs font-extrabold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview & Print
                  </Button>

                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(tmpl);
                        setIsEditorOpen(true);
                      }}
                      className="text-xs font-extrabold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {isOwner && (
                  <div className="flex space-x-2 text-[11px]">
                    {!tmpl.is_default && (
                      <button
                        type="button"
                        onClick={() => setDefaultMutation.mutate({ id: tmpl.id, type: tmpl.type })}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl font-bold text-slate-600 transition-all text-center"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => duplicateMutation.mutate(tmpl.id)}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl font-bold text-slate-600 transition-all text-center flex items-center"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Duplicate
                    </button>
                    {!tmpl.is_system && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tmpl)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold text-slate-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editingTemplate && (
        <TemplateEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTemplate(null);
          }}
          template={editingTemplate}
          onSave={async (updated) => {
            await saveMutation.mutateAsync(updated);
          }}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingTemplate && (
        <DocumentViewerModal
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setViewingTemplate(null);
          }}
          template={viewingTemplate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        title="Delete Custom Template"
        message={`Are you sure you want to delete custom template "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Template"
        variant="danger"
      />
    </div>
  );
}
