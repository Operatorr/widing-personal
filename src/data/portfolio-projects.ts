interface PortfolioProject {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  url: string;
  status: 'Live' | 'In development';
  resumeProject?: string;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'domarrow',
    name: 'DoMarrow',
    category: 'Project management',
    description: 'Project management for small teams, with boards and sprints to keep the work moving.',
    keywords: [
      'React', 'TypeScript', 'TanStack Router', 'TanStack Query', 'Hono API',
      'Neon Postgres', 'Hyperdrive', 'Clerk', 'MCP server', 'Tailwind CSS',
      'Cloudflare Workers', 'Wrangler',
    ],
    url: 'https://domarrow.app',
    status: 'Live',
  },
  {
    id: 'marrowtalk',
    name: 'MarrowTalk',
    category: 'Social & community',
    description: 'A social space for short posts, community discussions, and real-time chat.',
    keywords: [
      'React', 'TypeScript', 'TanStack Start', 'TanStack Router', 'MongoDB',
      'Prisma', 'Better Auth', 'Durable Objects', 'WebSockets', 'IndexedDB',
      'Local-first chat', 'Cloudflare Workers', 'Wrangler',
    ],
    url: 'https://marrowtalk.com',
    status: 'In development',
  },
  {
    id: 'vibe-translate',
    name: 'Vibe Translate',
    category: 'Language & AI',
    description: 'Translation with control over tone, dialect, and formality, plus explanations of words and grammar.',
    keywords: [
      'React', 'TypeScript', 'TanStack Router', 'TanStack Query', 'Hono API',
      'Neon Postgres', 'pgvector', 'Embeddings', 'OpenRouter', 'ElevenLabs',
      'Better Auth', 'Hyperdrive', 'Cloudflare Workers', 'Wrangler',
    ],
    url: 'https://translate.marrowtech.app',
    status: 'Live',
  },
  {
    id: 'ashen-omega',
    name: 'Ashen Omega',
    category: 'Multiplayer game',
    description: 'A real-time multiplayer game with a Godot client, a Rust server core, and a Go API. My MMO networking project.',
    keywords: [
      'Godot 4.6', 'GDScript', 'Rust', 'Go', 'PostgreSQL', 'Redis', 'GDExtension',
      'ENet/UDP', 'Server-authoritative simulation', 'Shared simulation',
      'Client prediction', 'Reconciliation', 'Snapshot interpolation',
      'Delta compression', 'Interest management', 'Bot load testing',
      'Prometheus', 'systemd',
    ],
    url: 'https://omega.marrowtech.app',
    status: 'In development',
    resumeProject: 'MMO Networking Proof-of-Concept',
  },
];
