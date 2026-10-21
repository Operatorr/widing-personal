import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateCommits } from "./contribution-utils.mjs";
const record = (sha, date, provider = "github") => ({
  sha: sha.repeat(40),
  date,
  provider,
  repository: `${provider}:1`,
});
test("deduplicates mirrors across accounts, branches and providers", () => {
  const result = aggregateCommits([
    record("a", "2012-06-01T12:00:00Z"),
    record("a", "2012-06-01T12:00:00Z", "bitbucket"),
    record("b", "2012-06-01T13:00:00Z", "bitbucket"),
  ]);
  assert.equal(result.total, 2);
  assert.deepEqual(result.days[0], {
    date: "2012-06-01",
    count: 2,
    github: 1,
    bitbucket: 1,
    repositories: 2,
  });
});
test("normalizes timezone, sorts old dates, retains leap days", () => {
  const result = aggregateCommits([
    record("a", "2024-03-01T01:00:00+07:00"),
    record("b", "2011-12-31T23:00:00Z"),
  ]);
  assert.equal(result.days[1].date, "2024-02-29");
  assert.equal(result.firstDate, "2011-12-31");
});
test("rejects corrupt imported data", () => {
  assert.throws(() => aggregateCommits([{ sha: "bad", date: "invalid" }]));
});

test("rejects unexpected providers", () => {
  assert.throws(() => aggregateCommits([record("a", "2020-01-01", "unknown")]));
});

test("counts distinct repositories per day without duplicating shared commits", () => {
  const a = record("a", "2020-01-02T01:00:00+02:00");
  const result = aggregateCommits([
    a, a,
    { ...a, repository: "github:2" },
    record("b", "2020-01-01T23:30:00Z"),
    record("c", "2020-01-02T12:00:00Z"),
  ]);
  assert.equal(result.total, 3);
  assert.deepEqual(result.days.map(({ date, count, repositories }) => ({ date, count, repositories })), [
    { date: "2020-01-01", count: 2, repositories: 2 },
    { date: "2020-01-02", count: 1, repositories: 1 },
  ]);
  assert(!JSON.stringify(result).includes("github:2"));
});

test("requires repository provenance rather than inventing zero repository counts", () => {
  assert.throws(() => aggregateCommits([{ ...record("a", "2020-01-01"), repository: undefined }]));
});
