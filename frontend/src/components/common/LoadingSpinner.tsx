'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`}
    />
  );
}
