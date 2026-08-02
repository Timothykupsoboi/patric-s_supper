'use client';

/**
 * UserAvatar — The single source of truth for displaying a user's avatar
 * throughout the entire application.
 *
 * Priority order:
 *  1. photo_url on the user object (already injected from localStorage by authService / employeeService)
 *  2. Initials derived from the user's name
 *
 * Usage:
 *   <UserAvatar user={user} size="md" />
 *   <UserAvatar name="John Doe" photoUrl={url} size="sm" />
 */

import React, { useState } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  /** Full user object (name + optional photo_url). Use this OR name/photoUrl. */
  user?: { name?: string | null; photo_url?: string | null } | null;
  /** Direct name override (used when passing raw string instead of full object) */
  name?: string;
  /** Direct photo URL override */
  photoUrl?: string | null;
  /** Avatar size preset */
  size?: AvatarSize;
  /** Extra CSS classes */
  className?: string;
  /** Shape — circle (default) or rounded square */
  shape?: 'circle' | 'square';
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

const SHAPE_CLASSES: Record<'circle' | 'square', string> = {
  circle: 'rounded-full',
  square: 'rounded-xl',
};

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export function UserAvatar({
  user,
  name,
  photoUrl,
  size = 'md',
  className = '',
  shape = 'circle',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const displayName = name ?? user?.name ?? undefined;
  const displayPhotoUrl = photoUrl ?? user?.photo_url ?? undefined;
  const initials = getInitials(displayName);

  const sizeClass = SIZE_CLASSES[size];
  const shapeClass = SHAPE_CLASSES[shape];
  const baseClass = `${sizeClass} ${shapeClass} flex-shrink-0 overflow-hidden flex items-center justify-center font-extrabold select-none`;

  if (displayPhotoUrl && !imgError) {
    return (
      <div className={`${baseClass} bg-slate-200 ${className}`}>
        <img
          src={displayPhotoUrl}
          alt={displayName || 'User avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} bg-gradient-to-br from-slate-700 to-slate-800 text-white border border-white/10 ${className}`}
      title={displayName || 'User'}
    >
      {initials}
    </div>
  );
}
