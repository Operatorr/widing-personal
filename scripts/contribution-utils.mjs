export function aggregateCommits(records) {
  const unique = new Map();
  for (const record of records) {
    if (!["github", "bitbucket"].includes(record.provider))
      throw new Error("Invalid provider");
    if (
      !/^[a-f0-9]{40,64}$/i.test(record.sha) ||
      !Number.isFinite(Date.parse(record.date)) ||
      typeof record.repository !== "string" || !record.repository.trim()
    )
      throw new Error("Invalid commit record");
    const sha = record.sha.toLowerCase();
    if (!unique.has(sha))
      unique.set(sha, { ...record, repositories: new Set() });
    unique.get(sha).repositories.add(record.repository);
  }
  const dates = new Map();
  for (const row of unique.values()) {
    const date = new Date(row.date).toISOString().slice(0, 10);
    const day = dates.get(date) || { date, count: 0, github: 0, bitbucket: 0, repositories: new Set() };
    day.count++;
    day[row.provider]++;
    for (const repository of row.repositories) day.repositories.add(repository);
    dates.set(date, day);
  }
  const days = [...dates.values()]
    .map(day => ({ ...day, repositories: day.repositories.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    total: unique.size,
    firstDate: days[0]?.date || null,
    lastDate: days.at(-1)?.date || null,
    days,
  };
}
