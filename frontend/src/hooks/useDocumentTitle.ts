import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | SentinelX` : 'SentinelX | AI-Powered SOC Platform';
    return () => { document.title = prev; };
  }, [title]);
}