import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { router } from './router';

const CLERK_PUBLISHABLE_KEY =
  (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_ZGVlcC1zbmFrZS01ODQ5LmNsZXJrLmFjY291bnRzLmRldiQ';

export const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/login">
      <RouterProvider router={router} />
    </ClerkProvider>
  );
};

export default App;
