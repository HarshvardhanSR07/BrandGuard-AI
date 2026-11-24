import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { router } from './router';

const CLERK_PUBLISHABLE_KEY = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    '[BrandGuard] VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
    'Add it to your .env file (or deployment environment) before starting the app.'
  );
}

export const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/login">
      <RouterProvider router={router} />
    </ClerkProvider>
  );
};

export default App;
