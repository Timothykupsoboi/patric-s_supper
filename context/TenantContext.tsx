'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { branchService, Branch } from '@/services/branchService';

interface TenantContextType {
  supermarketId: string;
  activeBranch: Branch | null;
  branches: Branch[];
  setBranch: (branch: Branch) => void;
  refreshBranches: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  supermarketId: '00000000-0000-0000-0000-000000000001',
  activeBranch: null,
  branches: [],
  setBranch: () => {},
  refreshBranches: async () => {},
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const supermarketId = '00000000-0000-0000-0000-000000000001';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

  const refreshBranches = async () => {
    try {
      const data = await branchService.getBranches(supermarketId);
      setBranches(data);
      if (data.length > 0 && !activeBranch) {
        setActiveBranch(data[0]);
      }
    } catch (e) {
      console.warn('Tenant branches query fallback:', e);
    }
  };

  useEffect(() => {
    refreshBranches();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        supermarketId,
        activeBranch,
        branches,
        setBranch: (b) => setActiveBranch(b),
        refreshBranches,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
