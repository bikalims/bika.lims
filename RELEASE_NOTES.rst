Release Notes
=============

Ingwe 4.2.1
-----------

* Change the bika.reports installation-profile dependency from
  Products.ATContentTypes:base to senaite.core:default. This preserves SENAITE's
  skin-layer precedence and fixes missing tabs on the Add Client form during
  automated site installation.
* Pin all 20 Git source repositories to explicit commits, including the tested
  bika.reports fix, and use the v4.2.1 Docker image tag.
* Document existing-site repair, fresh installation, local image testing and
  Docker Hub publishing. Compose profile ordering is unchanged.

Existing sites with missing Client tabs can reinstall senaite.core through
Admin → Site Setup → Manage Interface → portal_quickinstaller after taking a
database and blob-storage backup. No JavaScript compilation is required.

Update from 4.0 to 4.1
---------------------

This release packages the **Time Series** and **Received Sample Email** add-ons into the core release bundle, along with fixes and improvements to existing modules.

Upgrading from version 4.0 will automatically add these modules and apply all fixes to your existing installation.

For upgrade instructions, see the **Upgrading** section in the
`README <https://github.com/bikalims/bika.lims/blob/main/README.md#upgrading>`_.
