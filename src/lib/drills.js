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
//        coaching: ['Pass into space, not to feet', 'Time the run to stay onside'],
//        steps: ['Optional "How it runs" steps, in order']
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
  },
  {
    id: 'scanning-behind',
    name: 'Scanning Behind',
    drills: [
      {
        id: 'blind-side-rondo',
        name: 'Blind-Side Rondo',
        video: '/drills/scanning-behind/blind-side-rondo.mp4',
        poster: '/drills/scanning-behind/blind-side-rondo.jpg',
        description:
          'A midfielder receives with their back to half the grid and has to know what is behind.',
        setup: [
          '4v2 in a 12 × 12 m grid plus 1 midfielder in the middle (green)',
          '7 per grid: run 2 grids for 14–15 players'
        ],
        coaching: [
          'Look before the ball comes, not when it arrives',
          'Open up on the first touch',
          'Play to the side you could not see'
        ],
        steps: [
          'Outside players move the ball round the grid.',
          'The midfielder checks the blind side early.',
          'Receive and play forward to it: +2.',
          'Ball moves, body turns: check again.'
        ]
      },
      {
        id: 'shoulder-check-numbers',
        name: 'Shoulder Check Numbers',
        video: '/drills/scanning-behind/shoulder-check-numbers.mp4',
        poster: '/drills/scanning-behind/shoulder-check-numbers.jpg',
        description: 'A warm-up that makes checking over the shoulder a habit before every touch.',
        setup: [
          'Pairs 10 m apart, a flasher 5 m behind each receiver',
          '8 players: 3 pairs + 2 flashers',
          '15 players: groups of 3, rotate roles'
        ],
        coaching: [
          'Look as the pass is played, and again before it arrives',
          'Call the number out loud',
          'Receive with an open body'
        ],
        steps: [
          'Flasher shows a number behind the receiver.',
          'Check, call it, play it back.',
          'Odd: turn left. Even: turn right.',
          'Fist: man on. Play it back first time.'
        ]
      },
      {
        id: 'back-to-goal-gates',
        name: 'Back-to-Goal Gates',
        video: '/drills/scanning-behind/back-to-goal-gates.mp4',
        poster: '/drills/scanning-behind/back-to-goal-gates.jpg',
        description: 'The receiver checks behind to find the open gate before the ball arrives.',
        setup: [
          'Server, receiver and a blocker',
          'Two gates 10 m behind the receiver',
          'Groups of 3–4, run 2–4 stations'
        ],
        coaching: [
          'Check while the ball is travelling',
          'Turn on the first touch',
          'With a live defender, check twice'
        ],
        steps: [
          'Server plays in. Coach steps into one gate.',
          'Check, turn, dribble through the open gate.',
          'Progression: a live defender picks late.',
          'Check twice: the open gate can change.'
        ]
      },
      {
        id: 'pressure-from-behind',
        name: 'Pressure from Behind',
        video: '/drills/scanning-behind/pressure-from-behind.mp4',
        poster: '/drills/scanning-behind/pressure-from-behind.jpg',
        description: 'The receiver reads the defender behind them and picks the right first touch.',
        setup: [
          'A 15 × 10 m channel: server, receiver, a defender behind the receiver, a target at the far end',
          '4–5 per channel'
        ],
        coaching: [
          'Check before the ball arrives, not on it',
          'Tight defender: set it back first time',
          'Space: turn on the first touch'
        ],
        steps: [
          'The defender chooses: press tight or hang off.',
          'Defender tight: set it back first time.',
          'Defender off: turn and find the target.',
          'Scoring: turn + target +3, set-back +1, lose it −2.'
        ]
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
