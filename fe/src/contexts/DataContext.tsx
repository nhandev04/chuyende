import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type DataScope = 'dashboard' | 'history' | 'profile' | 'all';

interface DataContextType {
  dataVersion: number;
  invalidateData: (scope?: DataScope) => void;
  lastInvalidatedScope: DataScope;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState<number>(1);
  const [lastInvalidatedScope, setLastInvalidatedScope] = useState<DataScope>('all');

  const invalidateData = useCallback((scope: DataScope = 'all') => {
    setLastInvalidatedScope(scope);
    setDataVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      dataVersion,
      invalidateData,
      lastInvalidatedScope,
    }),
    [dataVersion, invalidateData, lastInvalidatedScope]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
