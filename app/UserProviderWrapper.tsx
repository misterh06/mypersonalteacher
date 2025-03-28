// app/UserProviderWrapper.tsx
'use client';

import { UserProvider } from './context/UserContext';

export function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
