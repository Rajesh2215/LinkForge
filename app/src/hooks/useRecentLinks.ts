import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export interface RecentLink {
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string;
  clicks?: number;
}

const STORAGE_KEY = 'linkforge_recent_links';
const MAX_SAVED_LINKS = 50;

export function useRecentLinks() {
  const [links, setLinks] = useState<RecentLink[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [refreshing, setRefreshing] = useState(false);


  // Listen for storage changes across browser tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setLinks(JSON.parse(event.newValue));
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Add or update a link at the top of the list
  const addLink = useCallback((link: {
    shortCode: string;
    originalUrl: string;
    createdAt?: string;
    expiresAt?: string;
  }) => {
    setLinks((prev) => {
      const existing = prev.filter((l) => l.shortCode !== link.shortCode);
      const updated: RecentLink[] = [
        {
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
          createdAt: link.createdAt || new Date().toISOString(),
          expiresAt: link.expiresAt,
          clicks: 0,
        },
        ...existing,
      ].slice(0, MAX_SAVED_LINKS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
      return updated;
    });
  }, []);

  // Remove a single link from local history
  const removeLink = useCallback((shortCode: string) => {
    setLinks((prev) => {
      const updated = prev.filter((l) => l.shortCode !== shortCode);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update localStorage', err);
      }
      return updated;
    });
  }, []);

  // Clear all local links
  const clearAllLinks = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLinks([]);
    } catch (err) {
      console.error('Failed to clear localStorage', err);
    }
  }, []);

  const linksRef = useRef(links);
  useEffect(() => {
    linksRef.current = links;
  }, [links]);

  // Refresh live click counts for all stored links
  const refreshClicks = useCallback(async () => {
    const currentLinks = linksRef.current;
    if (currentLinks.length === 0) return;
    setRefreshing(true);

    try {
      // Parallel requests for recent links
      const results = await Promise.allSettled(
        currentLinks.map((link) => api.getAnalytics(link.shortCode))
      );

      setLinks((prev) => {
        let hasChanges = false;
        const updated = prev.map((link, idx) => {
          const res = results[idx];
          if (res && res.status === 'fulfilled' && res.value) {
            const newClicks = res.value.totalClicks ?? 0;
            if (newClicks !== (link.clicks ?? 0)) {
              hasChanges = true;
              return {
                ...link,
                clicks: newClicks,
              };
            }
          }
          return link;
        });

        // Avoid triggering re-renders if no click counts changed or if requests failed
        if (!hasChanges) {
          return prev;
        }

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    } catch (err) {
      console.error('Error refreshing click counts:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    links,
    refreshing,
    addLink,
    removeLink,
    clearAllLinks,
    refreshClicks,
  };
}
