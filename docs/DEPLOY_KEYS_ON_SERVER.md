# Deploy keys on the server (CueFinder)

This repo uses **GitHub Deploy Keys** for the *server* to `git pull` the repository.

Deploy keys are **repository-scoped**:
- The **public key** is added in GitHub → Repo → Settings → Deploy keys.
- The **private key stays on the server** and is used by `git` when cloning/pulling.

> Deploy keys are not used by GitHub Actions automatically. They are meant for the server-side `git` operations.

## Goal

When the GitHub Actions workflow connects to the server and runs the deploy script, the server should be able to run:

- `git fetch`
- `git pull`

…without prompting for credentials.

## Server setup (single repository)

### 1) Put the deploy key private key on the server

On the server (as the deploy user, e.g. `cuefinder`):

- Save the private key as:

`/home/cuefinder/.ssh/cuefinder_deploy_key`

Permissions:
- `chmod 700 ~/.ssh`
- `chmod 600 ~/.ssh/cuefinder_deploy_key`

### 2) Add a matching SSH config entry

Create/edit:

`/home/cuefinder/.ssh/config`

Example:

```
Host github.com-cuefinder
  HostName github.com
  User git
  IdentityFile /home/cuefinder/.ssh/cuefinder_deploy_key
  IdentitiesOnly yes
```

Permissions:
- `chmod 600 ~/.ssh/config`

### 3) Make sure the repo remote uses the alias

Inside `/home/cuefinder/app`:

```
git remote set-url origin git@github.com-cuefinder:tselloss/CueFinder.git
```

Test:

```
ssh -T git@github.com-cuefinder
```

Expected:
- A message like "Hi! You've successfully authenticated..." (may also say no shell access).

## Notes

- Deploy keys are read-only by default.
- If you use multiple repos on the same server, you must use **one deploy key per repo** and add multiple `Host` aliases (see GitHub docs).

## Reference

GitHub docs: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys
