import { createClient } from '@/lib/supabase/client';
import { AuditLog } from '@/types';

export const auditService = {
  async logAction(
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
    userId?: string,
    supermarketId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<void> {
    const supabase = createClient();
    await supabase.from('audit_logs').insert([
      {
        supermarket_id: supermarketId,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    ]);
  },

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
