import { createClient } from '@/lib/supabase/client';
import { AuditLog } from '@/types';

export const auditService = {
  async logAction(
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
    userId: string = '00000000-0000-0000-0000-000000000001',
    supermarketId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<void> {
    const supabase = createClient();
    await supabase.from('audit_logs').insert([
      {
        supermarket_id: supermarketId,
        user_id: userId,
        action,
        table_name: entityType,
        record_id: entityId,
        new_values: details,
      },
    ]);
  },

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return (data || []).map((log: any) => ({
      ...log,
      entity_type: log.table_name,
      entity_id: log.record_id,
    }));
  },
};
