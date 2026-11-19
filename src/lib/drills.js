// The drill library. Folders and drills are shown in alphabetical order.
//
// Adding a drill:
//   1. Put the video (and an optional poster image) in public/drills/<folder id>/
//   2. Add an entry to that folder's `drills` list below, for example:
//      {
//        id: 'two-player-through-ball',
//        name: 'Two-player through ball',
//        video: '/drills/through-balls/two-player.mp4',
//        poster: '/drills/through-balls/two-player.jpg',
//        description: 'What the drill is for and how it works.',
//        setup: ['6 players', '20 × 30 m area', '4 cones, 1 ball per pair'],
//        coaching: ['Pass into space, not to feet', 'Time the run to stay onside']
//      }
// Videos play offline once the phone has downloaded them (see DrillsView).

const library = [
  {
    id: 'through-balls',
    name: 'Through Balls',
    drills: [
      {
        id: 'near-far-scanning',
        name: 'Near & Far Scanning',
        video: '/drills/through-balls/near-far-scanning.mp4',
        poster: '/drills/through-balls/near-far-scanning.jpg',
        description: 'Drill for decision making when passing to teammates close or far.',
        setup: ['8 players', '10 × 10 space', '4 cones', '2 bibs'],
        coaching: ['Use peripheral vision', 'Be quick and precise']
      },
      {
        id: 'scan-and-call',
        name: 'Scan and Call',
        video: '/drills/through-balls/scan-and-call.mp4',
        poster: '/drills/through-balls/scan-and-call.jpg',
        description:
          'Coach calls out a color; the center player scans and passes to the player standing by that cone.',
        setup: ['5 players', '10 × 10 grid', '4 cones'],
        coaching: ['Position body to receive and pass to the correct cone', 'Make use of both feet']
      }
    ]
  }
];

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });

/** Folders A–Z, each with its drills A–Z. */
export const folders = library
  .map((f) => ({ ...f, drills: [...f.drills].sort(byName) }))
  .sort(byName);

/** Every drill video, for downloading them all for offline use. */
export const allVideos = folders.flatMap((f) => f.drills.flatMap((d) => [d.video, d.poster].filter(Boolean)));
