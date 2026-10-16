import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { useEffect, useState } from 'react';

/*
 * Winner photos live as JPEG files in the app's private data folder.
 * Matches only store the relative path, so the JSON state (and backups) stay small.
 */

export async function savePhoto(matchId: string, dataUrl: string): Promise<string> {
  // Timestamp in the name so a retake never shows a cached old image.
  const path = `photos/${matchId}-${Date.now()}.jpg`;
  await Filesystem.writeFile({ path, data: dataUrl.split(',')[1], directory: Directory.Data, recursive: true });
  return path;
}

export async function deletePhoto(path: string | undefined): Promise<void> {
  if (!path) return;
  cache.delete(path);
  try {
    await Filesystem.deleteFile({ path, directory: Directory.Data });
  } catch {
    // Already gone (e.g. restored from a backup on another phone).
  }
}

const cache = new Map<string, string>();

async function resolve(path: string): Promise<string | undefined> {
  const hit = cache.get(path);
  if (hit) return hit;
  try {
    let url: string;
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
      await Filesystem.stat({ path, directory: Directory.Data });
      url = Capacitor.convertFileSrc(uri);
    } else {
      const { data } = await Filesystem.readFile({ path, directory: Directory.Data });
      url = typeof data === 'string' ? `data:image/jpeg;base64,${data}` : URL.createObjectURL(data);
    }
    cache.set(path, url);
    return url;
  } catch {
    return undefined;
  }
}

/** Displayable URL for a stored photo, or undefined while loading / if missing. */
export function usePhoto(path: string | undefined): string | undefined {
  const [url, setUrl] = useState(() => (path ? cache.get(path) : undefined));
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(undefined);
      return;
    }
    void resolve(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}
