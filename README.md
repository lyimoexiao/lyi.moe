# lyi.moe

Personal blog built with [Astro](https://astro.build/).

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## Deployment

`.github/workflows/deploy.yml` builds the site on every push to `master` (or
manually via **Actions → Deploy → Run workflow**) and rsyncs `dist/` to a server
over SSH.

Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret               | Required | Description                                                                  |
| :------------------- | :------- | :--------------------------------------------------------------------------- |
| `DEPLOY_HOST`        | yes      | Server IP or hostname                                                        |
| `DEPLOY_USER`        | yes      | SSH user (needs write access to the web root)                                |
| `DEPLOY_SSH_KEY`     | yes      | Private key in OpenSSH format (the whole file contents)                      |
| `DEPLOY_PORT`        | no       | SSH port, defaults to `22`                                                   |
| `DEPLOY_PATH`        | no       | Web root, defaults to `/var/www/lyi.moe`                                     |
| `DEPLOY_KNOWN_HOSTS` | no       | Pinned `known_hosts` line; without it the host key is scanned at deploy time |

Create and install a dedicated key:

```sh
ssh-keygen -t ed25519 -C 'github-actions lyi.moe' -f deploy_key -N ''
ssh-copy-id -i deploy_key.pub user@your-server   # or append to ~/.ssh/authorized_keys
gh secret set DEPLOY_SSH_KEY < deploy_key
```

The deploy uses `rsync --delete`, so files removed from `dist/` also disappear
from the web root; `.well-known/` is excluded so ACME challenge files survive.
The server should serve that directory directly and can use the pre-compressed
sidecars written by the build (`gzip_static on;` in nginx).
