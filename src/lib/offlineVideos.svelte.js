// Keeps drill videos on the phone so they play with no signal.
// The page downloads each video in full into the "drill-videos" cache; the
// offline worker (vite.config.js) then answers the video player from that
// cache, including the partial requests iPhones make while playing.

export const CACHE = 'drill-videos';

class OfflineVideos {
  /** url -> 'saved' | 'saving' | 'missing' */
  status = $state({});
  supported = typeof caches !== 'undefined';

  /** Download any videos not saved yet, and drop ones no longer in the library. */
  async sync(urls) {
    if (!this.supported || urls.length === 0) return;
    let cache;
    try {
      cache = await caches.open(CACHE);
    } catch {
      return; // e.g. private browsing
    }

    for (const url of urls) {
      this.status[url] = (await cache.match(url)) ? 'saved' : 'missing';
    }

    const keep = new Set(urls.map((u) => new URL(u, location.href).href));
    for (const req of await cache.keys()) {
      if (!keep.has(req.url)) await cache.delete(req);
    }

    if (!navigator.onLine) return;
    for (const url of urls) {
      if (this.status[url] === 'saved') continue;
      this.status[url] = 'saving';
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (!res.ok) throw new Error(res.status);
        await cache.put(url, res);
        this.status[url] = 'saved';
      } catch {
        this.status[url] = 'missing'; // try again next time Drills is opened
      }
    }
  }
}

export const offlineVideos = new OfflineVideos();
