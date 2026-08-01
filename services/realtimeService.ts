import { createClient } from '@/lib/supabase/client';

export const realtimeService = {
  subscribeToSales(onNewSale: (payload: any) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel('public:sales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        (payload) => {
          onNewSale(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToStockChanges(onStockUpdate: (payload: any) => void) {
    const supabase = createClient();
    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          onStockUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
