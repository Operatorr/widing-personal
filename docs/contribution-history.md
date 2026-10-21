# Contribution history

The site displays daily counts from `src/data/contributions.json`. It makes no API calls in the browser. The importer reads commit metadata, matches the author's GitHub account or confirmed email, and counts each Git SHA once across branches, forks and providers. It includes merge commits authored by those identities, but does not count issues, pull requests or reviews as commits.

## Refresh GitHub

The three accounts must be signed in through `gh auth login`:

- Operatorr
- eqho-dev
- OMG-group-tech

Run `npm run sync:contributions`. The script retrieves each account's token from the keychain without changing the active `gh` account. It paginates accessible repositories, branches and matching commits. Complete repository scans are cached locally for 24 hours; new author identities are checked even against a recent cache. Use `npm run sync:contributions -- --refresh` to rescan everything.

The cache is additive: a verified record remains in the archive if its branch is later removed. Do not delete the local cache if you want to retain those records. Cache files live in ignored `temp/contributions-cache/`; they contain commit hashes and dates, not tokens or source code.

## Connect the two Bitbucket accounts

1. Sign into each Atlassian account and [create a scoped API token for Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/create-an-api-token/).
2. Select these read scopes: `read:repository:bitbucket`, `read:user:bitbucket`, `read:workspace:bitbucket`. No write permissions are needed.
3. Open the ignored `.env.contributions` file at the repository root. The two email fields are already filled in. Add the respective API token to `BITBUCKET_PERSONAL_TOKEN` and `BITBUCKET_WORK_TOKEN`. Use the Atlassian login email if it differs from the commit author email. Keep tokens out of chat and Git.
4. Run `npm run sync:contributions` again. The importer identifies each authenticated user, discovers their accessible workspaces, then reads all repository commits across branches and tags. Shared repositories are scanned once and matched separately to each account. If workspace discovery is restricted, add the workspace slugs from the repository URLs to the local identities file.
5. Run `npm run build` after a successful import.

The local `temp/contribution-identities.json` contains author emails and the Bitbucket account configuration. An empty `workspaces` array enables discovery. A `uuid` is optional; by default the importer gets the authenticated user's UUID from Bitbucket. Only that UUID or the confirmed author emails match a commit. Display names alone are never used for attribution.

Example configuration (replace the example values locally):

```json
{
  "emails": ["personal@example.com", "work@example.com"],
  "bitbucket": [
    {
      "name": "Personal",
      "emailEnv": "BITBUCKET_PERSONAL_EMAIL",
      "tokenEnv": "BITBUCKET_PERSONAL_TOKEN",
      "workspaces": []
    },
    {
      "name": "Work",
      "emailEnv": "BITBUCKET_WORK_EMAIL",
      "tokenEnv": "BITBUCKET_WORK_TOKEN",
      "workspaces": []
    }
  ]
}
```

Use Node 22 or newer (`process.loadEnvFile` loads the optional local credentials). API tokens are sent only to the provider's API host. The importer follows API pagination but rejects unexpected hosts and redirects.

## Coverage and interpretation

The chart and its commit total start in 2017. Earlier imported records remain in the data archive. Professional experience is counted separately from September 2015; the deleted work repositories from 2015 and 2016 do not shorten that experience. Many client repositories from 2020–2022 have also been removed, so those years contain only part of the work completed. Dates use the commit's author timestamp converted to UTC. No activity is invented for missing years or days. GitHub's own profile calendar uses different contribution rules, so the numbers need not match.

Each day includes a distinct repository count. The importer attaches the provider and stable repository ID to each record in memory, then publishes only the count. Repeated scans of the same repository across accounts count once. Forks and mirrors are separate repositories, while a shared commit still counts only once. Repository attribution is reconstructed from existing cache files, so this addition does not require downloading all history again.

GitHub scans currently accessible repository branches. Bitbucket scans all accessible branches and tags. Deleted or inaccessible repositories, GitHub tags with no surviving branch, removed branches not in the local cache, Mercurial repositories, and unknown author aliases need separate recovery. Authentication does not grant access to repositories removed from an account. The `complete` field means configured source scans succeeded; it does not prove that every historical repository has been recovered.

The public JSON contains dates, commit and repository counts, source account names and scan status. It excludes author emails, repository names and IDs, commit hashes, messages and source code. Failures are reported in `temp/contributions-cache/last-report.json`; the site also labels an incomplete import. A run with no verified commits preserves the existing public snapshot.

Run `npm run test:contributions` to check cross-provider deduplication, date handling and invalid input rejection.

References: [Bitbucket users API](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/), [workspace discovery](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-workspaces/), [token permissions](https://support.atlassian.com/bitbucket-cloud/docs/api-token-permissions/).

Bitbucket checkpoints also live in `temp/contributions-cache/`. They retain only commit hashes, dates and author identifiers (email and UUID) for attribution across the two accounts. This metadata stays local. Repository scans are reused for 24 hours unless `--refresh` is passed.
