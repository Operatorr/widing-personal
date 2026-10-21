/** Read-only history import. Only aggregate dates/counts enter the public site. */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { aggregateCommits } from "./contribution-utils.mjs";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
if (existsSync(".env.contributions")) process.loadEnvFile(".env.contributions");
const accounts = ["Operatorr", "eqho-dev", "OMG-group-tech"];
const cacheDir = "temp/contributions-cache";
await mkdir(cacheDir, { recursive: true });
const identities = existsSync("temp/contribution-identities.json")
  ? JSON.parse(await readFile("temp/contribution-identities.json", "utf8"))
  : { emails: [], bitbucket: [] };
const records = [],
  failures = [],
  sources = [];
let calls = 0;
async function request(url, authorization) {
  const allowed = ["api.github.com", "api.bitbucket.org"];
  if (!allowed.includes(new URL(url).hostname))
    throw new Error("Unexpected pagination host");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: authorization, Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(45000),
    });
    calls++;
    if (response.status === 409) return []; // Empty Git repository.
    if (response.ok) return response.json();
    if (
      [429, 502, 503, 504].includes(response.status) ||
      (response.status === 403 &&
        (response.headers.get("retry-after") ||
          response.headers.get("x-ratelimit-remaining") === "0"))
    ) {
      const retry = Number(response.headers.get("retry-after") || 15);
      if (retry > 60)
        throw new Error(
          `Rate limited; retry import later (HTTP ${response.status})`,
        );
      await new Promise((r) => setTimeout(r, retry * 1000));
      continue;
    }
    throw new Error(`HTTP ${response.status}`);
  }
  throw new Error("API retry limit reached");
}
async function githubPages(path, auth) {
  const rows = [];
  for (let page = 1; ; page++) {
    const data = await request(
      `https://api.github.com${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
      auth,
    );
    if (!Array.isArray(data)) throw new Error("Unexpected GitHub response");
    rows.push(...data);
    if (data.length < 100) return rows;
  }
}
async function bitbucketPages(url, auth) {
  const rows = [];
  while (url) {
    const data = await request(url, auth);
    if (Array.isArray(data) && !data.length) return rows;
    if (!Array.isArray(data.values))
      throw new Error("Unexpected Bitbucket response");
    rows.push(...data.values);
    url = data.next;
  }
  return rows;
}
const repos = new Map();
for (const account of accounts) {
  try {
    // gh's active account is never changed. Tokens stay in this process's memory.
    const token = execFileSync("gh", ["auth", "token", "--user", account], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const auth = `Bearer ${token}`;
    const list = await githubPages(
      "/user/repos?affiliation=owner,collaborator,organization_member",
      auth,
    );
    for (const repo of list)
      if (!repos.has(repo.id)) repos.set(repo.id, { ...repo, auth });
    sources.push({ provider: "github", account, status: "connected" });
    console.log(`${account}: ${list.length} accessible repositories`);
  } catch (error) {
    failures.push({ source: account, error: error.message });
    sources.push({ provider: "github", account, status: "error" });
  }
}
let done = 0;
const queue = [...repos.values()];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const repo = queue.shift();
      const cacheFile = `${cacheDir}/github-${repo.id}.json`;
      const authors = [...accounts, ...(identities.emails || [])];
      try {
        const cached = existsSync(cacheFile)
          ? JSON.parse(await readFile(cacheFile, "utf8"))
          : null;
        const cachedAuthors = cached?.authors || accounts;
        const fresh =
          cached &&
          Date.now() - Date.parse(cached.fetchedAt) < 24 * 60 * 60 * 1000 &&
          !process.argv.includes("--refresh");
        const pendingAuthors = fresh
          ? authors.filter((a) => !cachedAuthors.includes(a))
          : authors;
        const commits = new Map(
          (cached?.records || []).map((row) => [row.sha, row]),
        );
        if (pendingAuthors.length) {
          const branches = await githubPages(
            `/repos/${repo.full_name}/branches`,
            repo.auth,
          );
          for (const branch of branches) {
            for (const author of pendingAuthors) {
              const rows = await githubPages(
                `/repos/${repo.full_name}/commits?sha=${encodeURIComponent(branch.name)}&author=${encodeURIComponent(author)}`,
                repo.auth,
              );
              for (const row of rows) {
                const login = row.author?.login;
                const account =
                  accounts.find(
                    (a) => a.toLowerCase() === login?.toLowerCase(),
                  ) || "historical-email";
                commits.set(row.sha, {
                  sha: row.sha,
                  date: row.commit.author.date,
                  provider: "github",
                  account,
                });
              }
            }
          }
          await writeFile(
            cacheFile,
            JSON.stringify({
              fetchedAt: new Date().toISOString(),
              authors,
              records: [...commits.values()],
            }),
          );
        }
        records.push(...[...commits.values()].map(row => ({ ...row, repository: `github:${repo.id}` })));
      } catch (error) {
        failures.push({
          source: `repository-${repo.id}`,
          error: error.message,
        });
        if (existsSync(cacheFile))
          records.push(
            ...JSON.parse(await readFile(cacheFile, "utf8")).records.map(row => ({ ...row, repository: `github:${repo.id}` })),
          );
      }
      done++;
      if (done % 5 === 0 || !queue.length)
        console.log(
          `GitHub: ${done}/${repos.size} repositories scanned; ${records.length} records before deduplication`,
        );
    }
  }),
);
const bitbucketRepos = new Set();
const scannedBitbucketRepos = new Set();
for (const account of identities.bitbucket || []) {
  try {
    const email = process.env[account.emailEnv],
      token = process.env[account.tokenEnv];
    if (!email || !token) {
      sources.push({
        provider: "bitbucket",
        account: account.name,
        status: "pending",
      });
      continue;
    }
    const auth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
    const emails = new Set(
      (identities.emails || []).map((e) => e.toLowerCase()),
    );
    const user = await request("https://api.bitbucket.org/2.0/user", auth);
    const uuid = account.uuid || user.uuid;
    const workspaces = account.workspaces?.length
      ? account.workspaces
      : (
          await bitbucketPages(
            "https://api.bitbucket.org/2.0/user/workspaces?pagelen=100",
            auth,
          )
        ).map((item) => item.workspace.slug);
    if (!workspaces.length)
      throw new Error("No accessible Bitbucket workspaces found");
    console.log(
      `${account.name}: ${workspaces.length} accessible Bitbucket workspaces`,
    );
    for (const workspace of workspaces) {
      const repos = await bitbucketPages(
        `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(workspace)}?pagelen=100`,
        auth,
      );
      let scanned = 0;
      for (const repo of repos) {
        bitbucketRepos.add(repo.uuid);
        const root = `https://api.bitbucket.org/2.0/repositories/${repo.full_name}`;
        const cacheFile = `${cacheDir}/bitbucket-${repo.uuid.replace(/[{}]/g, "")}.json`;
        try {
          let cached = existsSync(cacheFile) ? JSON.parse(await readFile(cacheFile, "utf8")) : null;
          const fresh = cached && (scannedBitbucketRepos.has(repo.uuid) || (Date.now() - Date.parse(cached.fetchedAt) < 24 * 60 * 60 * 1000 && !process.argv.includes("--refresh")));
          if (!fresh) {
            // Bitbucket's unqualified commits endpoint includes every branch and tag.
            const rows = await bitbucketPages(`${root}/commits?pagelen=100`, auth);
            const previous = new Map((cached?.commits || []).map(row => [row.sha, row]));
            for (const row of rows) previous.set(row.hash, {
              sha: row.hash,
              date: row.date,
              email: row.author?.raw?.match(/<([^>]+)>/)?.[1]?.toLowerCase(),
              uuid: row.author?.user?.uuid,
            });
            cached = { fetchedAt: new Date().toISOString(), commits: [...previous.values()] };
            await writeFile(cacheFile, JSON.stringify(cached));
          }
          scannedBitbucketRepos.add(repo.uuid);
          for (const row of cached.commits) {
            if ((uuid && row.uuid === uuid) || (row.email && emails.has(row.email))) {
              records.push({ sha: row.sha, date: row.date, provider: "bitbucket", account: account.name, repository: `bitbucket:${repo.uuid}` });
            }
          }
        } catch (error) {
          failures.push({ source: account.name, repository: repo.uuid, error: error.message });
        }
        scanned++;
        console.log(`${account.name}: ${scanned}/${repos.length} repositories in workspace scanned; ${records.length} records before deduplication`);
      }
    }
    sources.push({
      provider: "bitbucket",
      account: account.name,
      status: failures.some(f => f.source === account.name) ? "error" : "connected",
    });
  } catch (error) {
    failures.push({ source: account.name, error: error.message });
    sources.push({
      provider: "bitbucket",
      account: account.name,
      status: "error",
    });
  }
}
const connectedBB = sources.filter((s) => s.provider === "bitbucket").length;
for (let i = connectedBB; i < 2; i++)
  sources.push({
    provider: "bitbucket",
    account: `Bitbucket ${i + 1}`,
    status: "pending",
  });
const data = aggregateCommits(records);
const output = {
  generatedAt: new Date().toISOString(),
  coverage: "accessible-branch-history",
  complete:
    failures.length === 0 && sources.every((s) => s.status === "connected"),
  repositoryCount: repos.size + bitbucketRepos.size,
  failedImports: failures.length,
  sources,
  ...data,
};
if (!records.length)
  throw new Error(
    "No verified commits found; existing public snapshot preserved",
  );
await writeFile(
  "src/data/contributions.json",
  JSON.stringify(output, null, 2) + "\n",
);
await writeFile(
  `${cacheDir}/last-report.json`,
  JSON.stringify({ failures, calls }, null, 2),
);
console.log(
  JSON.stringify({
    total: data.total,
    firstDate: data.firstDate,
    lastDate: data.lastDate,
    apiCalls: calls,
    failures: failures.length,
    complete: output.complete,
  }),
);
if (failures.length) process.exitCode = 1;
