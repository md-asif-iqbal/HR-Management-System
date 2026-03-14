'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  label: string;
  icon?: string;
  onClick: () => Promise<void> | void;
  variant?: 'default' | 'outline';
}

export default function ExportButton({ label, icon = '📥', onClick, variant = 'outline' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5 min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <span>{icon}</span>
      )}
      {label}
    </Button>
  );
}
