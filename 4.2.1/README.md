# Ingwe Bika LIMS 4.2.1

This maintenance release corrects the `bika.reports` profile dependency that
caused missing Client tabs during automated site installation. The dependency
is now `senaite.core:default`, which restores SENAITE's skin-layer precedence.
All 20 Git sources are pinned in `buildout.cfg`.

## Start a fresh installation

From this directory, once the image is available on Docker Hub:

```bash
docker compose pull
docker compose up -d
docker compose logs -f instance1
```

Open http://localhost:8081/bikalims/ and log in with `admin` / `admin`.
Change the administrator password before using the site for real work.
The first startup creates the site and applies the configured add-on profiles.

If the image tag is not published yet, build it locally using the next section,
then run `docker compose up -d`.

## Build and test locally

Ensure the `bika.reports` branch `ingwe4.2.1` has been pushed to GitHub so the
pinned fix commit `112b788fc5e26d1fee0d82db27f9ae3d3e66325d` can be fetched.

```bash
docker build --progress=plain -t bikalims/bikalims:v4.2.1 .
docker compose up -d
docker compose logs -f instance1
```

Stop other stacks using host ports 8081 and 8082 before starting this stack.
Check all four Add Client tabs, save a Client, open the Clients listing, and
check the Reports Productivity and Administration pages before publishing.

The dependency fix passed fresh-install checks in a local ZEO installation.
The v4.2.1 Docker image also passed checks for all four Client tabs, saving a
Client, the Clients listing, and both Reports pages.

## Existing installations

Back up the database and blob storage before upgrading. This Compose file mounts
`./data` relative to this release directory. Starting it with an empty `4.2.1/data`
creates a separate installation; it does not upgrade the database in `4.2.0/data`.
To upgrade an existing installation, preserve its data mount and update all three
service image references to `bikalims/bikalims:v4.2.1`.

For an existing site with missing Client tabs, navigate to
**Admin → Site Setup → Manage Interface → portal_quickinstaller**, select
**senaite.core**, and click **Reinstall**. This reapplies the expected template
configuration without deleting the site or compiling JavaScript.

## Publish to Docker Hub

After testing the image, use an account with push access to `bikalims/bikalims`:

```bash
docker login
docker push bikalims/bikalims:v4.2.1
```

The build command creates the `v4.2.1` image tag. These commands do not change
the `v4.2.0` or `latest` tags.
