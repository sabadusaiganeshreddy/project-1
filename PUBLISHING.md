# Publish without ZIP uploads

Your public address stays **https://the-daily-edit-finds.pages.dev/**. The repository is **https://github.com/sabadusaiganeshreddy/project-1**. The build and deployment run in GitHub Actions and update the existing Cloudflare Pages project. No new Pages project or domain is needed.

## One-time connection

### 1. Sign in to GitHub on this Mac

The GitHub CLI is used for local Git authentication. If needed, install it with Homebrew:

```sh
brew install gh
```

Then run:

```sh
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
gh auth setup-git
```

Complete GitHub's browser sign-in yourself. Never paste passwords or API tokens into chat or source files. GitHub needs permission to publish the workflow as well as the site source. The local catalog manager never receives your GitHub password or Cloudflare token.

### 2. Connect the empty repository

In this project directory, run:

```sh
node scripts/setup-publishing.mjs https://github.com/sabadusaiganeshreddy/project-1
```

Initial setup requires an empty repository. The script rejects a repository with existing `main` content. It keeps a separate ignored checkout in `.publishing/`, leaving the original project's Git history and staged edits alone. Once set up, rerunning setup for the same repository preserves that connection.

### 3. Add Cloudflare credentials in GitHub

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add exactly these two names:

| Secret name | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID for the Cloudflare account that contains `the-daily-edit-finds` |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with **Account → Cloudflare Pages → Edit**, scoped to that account |

Create the token in Cloudflare's **API Tokens → Create Token → Custom token** area. Use the smallest account scope needed for this site. Store it directly in GitHub's secret field. Do not put it in this folder, `catalog.json`, or chat.

The account ID is available in your Cloudflare account dashboard. If you open the Pages project, the dashboard address also contains your account ID. It is a 32-character identifier, not the project name or your email address. No domain purchase is required.

### 4. Make the first publish

Restart **Start Store.command** if the catalog manager is already running, then visit:

```text
http://127.0.0.1:4173/manage
```

Choose **Publish updates**. This copies the application source to the separate checkout, commits changes, and pushes to GitHub. It includes the publishing workflow and images, but excludes `.env`, the original `.git`, `.openai`, local publishing state, and generated ZIPs.

In the repository's **Actions** tab, open **Publish storefront**. Wait for a green successful result, then open your public website. The manager confirms the GitHub push; only a successful Actions run confirms Cloudflare deployment.

If you add secrets after the first push, use **Actions → Publish storefront → Run workflow** to retry without another content change. A failed push leaves the catalog and local commit available for retry; the publisher never force-pushes.

## Every day

1. Open **Start Store.command** and the catalog manager.
2. Add, edit, or archive products; save your changes.
3. Click **Publish updates** once for the batch.
4. Wait for **Publish storefront** to succeed in GitHub Actions.

You no longer need to create or upload a ZIP. Saving alone updates the local preview. Archived product URLs continue to exist for older Pins. Keep your source folder backed up.

Use the catalog manager on this Mac as the source of edits. Changes made independently in GitHub can cause a push conflict; stop and reconcile the changes instead of overwriting either copy.

## Hosting and costs

This uses the existing Cloudflare Pages free static site and a standard GitHub-hosted Linux runner. Public repositories receive free standard Actions usage; private repositories have an included allowance. Keep paid runners and paid add-ons disabled and review the account's Actions allowance if using a private repository. No credentials are needed in the public site itself.

Cloudflare's documented workflow: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/

## Manual fallback

**Download website ZIP** remains available if publishing is unavailable. Upload it to the same existing Cloudflare Pages project. This does not disconnect GitHub Actions.
