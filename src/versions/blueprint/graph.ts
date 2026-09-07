import { resume, techWork, type Project, type Work } from '../../lib/resume';

/**
 * The hero diagram is built from resume.json: one node per tech role, one per
 * project, plus one system node for the AI work tied to the current role.
 * Edges run project -> the role (entity) that built it. Geometry is a fixed
 * 1100 x 560 unit sheet so the SVG connectors can be rendered at build time
 * and the page is complete without JavaScript.
 */

export const SHEET = { w: 1100, h: 560 } as const;

export type NodeKind = 'role' | 'project' | 'system';

export interface DiagramNode {
  id: string;
  kind: NodeKind;
  title: string;
  sub: string;
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** id of the role this node hangs off (projects and the system node) */
  parent?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  d: string;
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Short company name for a node label: "DxT Corporation Co., Ltd." -> "DxT Corporation" */
function shortCompany(name: string): string {
  return name
    .replace(/\s*(Co\.,?\s*Ltd\.?|Pte\.?\s*Ltd\.?|Ltd\.?|AB)\s*$/i, '')
    .replace(/,\s*$/, '')
    .trim();
}

/** Match a project's `entity` to the role that built it. */
export function roleForProject(project: Project, roles: Work[]): Work | undefined {
  const entity = (project as { entity?: string }).entity;
  if (!entity) return undefined;
  const e = entity.toLowerCase();
  return roles.find((r) => r.name.toLowerCase().startsWith(e));
}

export function roleId(i: number): string {
  return `r-${String(i + 1).padStart(2, '0')}`;
}
export function projectId(i: number): string {
  return `p-${String(i + 1).padStart(2, '0')}`;
}

const ROLE = { x: 0, w: 280, h: 80, y0: 60, gap: 100 };
const PROJ = { x: 560, w: 300, h: 72, y0: 8, gap: 92 };
const SYS = { x: 330, y: 0, w: 210, h: 64 };
const CHANNEL_X = 400;

export function buildGraph(): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const roles = techWork();
  const projects = resume.projects;
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  roles.forEach((r, i) => {
    nodes.push({
      id: roleId(i),
      kind: 'role',
      title: shortCompany(r.name),
      sub: r.position,
      href: `#role-${i + 1}`,
      x: ROLE.x,
      y: ROLE.y0 + i * ROLE.gap,
      w: ROLE.w,
      h: ROLE.h,
    });
  });

  projects.forEach((p, i) => {
    const owner = roleForProject(p, roles);
    const parent = owner ? roleId(roles.indexOf(owner)) : undefined;
    nodes.push({
      id: projectId(i),
      kind: 'project',
      title: p.name,
      sub: (p as { entity?: string }).entity ?? p.roles.join(', '),
      href: `#project-${slug(p.name)}`,
      x: PROJ.x,
      y: PROJ.y0 + i * PROJ.gap,
      w: PROJ.w,
      h: PROJ.h,
      parent,
    });
  });

  // One system node for the AI work, tied to the current (first) role.
  const current = roleId(0);
  nodes.push({
    id: 's-01',
    kind: 'system',
    title: 'AI / RAG systems',
    sub: 'RAG, LLM agents, evals',
    href: '#skill-ai-engineering',
    x: SYS.x,
    y: SYS.y,
    w: SYS.w,
    h: SYS.h,
    parent: current,
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Project -> role elbows, each with its own channel x so lines do not overlap.
  let lane = 0;
  for (const n of nodes) {
    if (n.kind !== 'project' || !n.parent) continue;
    const r = byId.get(n.parent)!;
    const cx = CHANNEL_X + (lane++ % 4) * 22;
    const y1 = n.y + n.h / 2;
    const y2 = r.y + r.h / 2;
    const xEnd = r.x + r.w + 6; // leave room for the arrowhead
    edges.push({
      from: n.id,
      to: r.id,
      d: `M ${n.x} ${y1} H ${cx} V ${y2} H ${xEnd}`,
    });
  }

  // Role -> system node: leaves the top of the role, then into the node's left side.
  const sys = byId.get('s-01')!;
  const cur = byId.get(current)!;
  const sx = cur.x + cur.w * 0.72;
  const sy = sys.y + sys.h / 2;
  edges.push({
    from: sys.id,
    to: cur.id,
    d: `M ${sys.x} ${sy} H ${sx} V ${cur.y}`,
  });

  return { nodes, edges };
}
