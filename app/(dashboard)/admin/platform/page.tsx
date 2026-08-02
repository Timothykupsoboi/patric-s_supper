'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyPlatformRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/platform');
  }, [router]);

  return null;
}
