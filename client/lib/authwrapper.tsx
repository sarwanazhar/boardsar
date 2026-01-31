'use client';

import { useEffect } from 'react';
import { useInitAuth } from '@/lib/store';

export default function AuthInitWrapper() {
  const { initAuth } = useInitAuth();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null; // no UI
}
