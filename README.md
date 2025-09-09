### 🐳 Ingwe Bika LIMS 4 - Docker Suite

This repository provides an official Docker-based distribution of [Bika Open Source LIMS](https://www.bikalims.org).

Ingwe is a powerful, feature‑rich laboratory information management system built on the rock‑solid foundation of Senaite. At its core, Ingwe shares Senaite's modern architecture, clean UI, robust API, and proven modularity. But Ingwe goes further. Professionally supported by [Bika Lab Systems](https://bikalabs.com), Bika and Senaite service provider since 2002, Ingwe delivers more than a platform - it delivers two decades of deep domain expertise, innovation, and commitment to your lab's success.

With Ingwe, you get all of Senaite's core strengths, plus extensive enhancements and refinements commissioned by forward‑thinking laboratories and maintained by the Bika team. The result is a more capable and more efficient LIMS - backed by dedicated support from the people who have been perfecting laboratory solutions for over 20 years.

💡 The release contains only Docker packaging, deployment scripts, and documentation - not the application source code which lives in their own repositories.
It aims to install a fully functional LIMS with key-add-ons, ready to be used. Not all available add-ons have been integrated and are available from their source repositories. See the Manifest below. Sadly Invoicing did not make the cut, it is the first priority for an upgrade.

**NB Full installations** are better suited for development environments, and including a load balancer, for production environments.  Please see the [Installation Manual](https://github.com/bikalims/bika.documentation/blob/main/docs/BikaSenaiteServerIntroduction.md).

## Content

- [Included: Preinstalled and Activated](https://github.com/bikalims/bika.lims/blob/main/README.md#-included-preinstalled-and-activated)
- [Available, to be integrated](https://github.com/bikalims/bika.lims/blob/main/README.md#-quick-start----docker-compose)
- [Quick Start - Docker Compose](#quick-start-docker-compose)
- [Change the admin password](#change-the-admin-password)
- [Configuration](https://github.com/bikalims/bika.lims/blob/main/README.md#configuration)
- [Upgrading](https://github.com/bikalims/bika.lims/blob/main/README.md#-upgrading)
- [Component Versions](https://github.com/bikalims/bika.lims/blob/main/README.md#-component-versions)
- [Licence](https://github.com/bikalims/bika.lims/blob/main/README.md#-licence)
- [Resources](https://github.com/bikalims/bika.lims/blob/main/README.md#-resources)
- [Support](https://github.com/bikalims/bika.lims/blob/main/README.md#-support)
- [Disclaimer](https://github.com/bikalims/bika.lims/blob/main/README.md#%EF%B8%8F-disclaimer)

### Included: Preinstalled and Activated

#### Senaite Core
- senaite.core - The main framework providing the foundation for Senaite/Bika LIMS
- senaite.app.listing - ReactJS listing component for modern, dynamic listings
- senaite.lims - Meta package installing all required dependencies for Senaite/Bika LIMS
- senaite.impress - Rendering of Certificates of Analysis (COAs) to PDF
- senaite.storage - Sample Storage module

#### Bika-managed Add‑ons
- senaite.instruments - Collection of instrument interfaces, updated regularly
- senaite.sampleimporter - Bulk Sample Imports from spreadsheets
- senaite.samplepointlocations - Two‑tier Sample Point structure, per Location
- senaite.timeseries - Enables tabled and graphed Time Series results
- senaite.crms - Improved reference sample management
- bika.ui - Makes branding the LIMS easier and restores Bika iconography to replace default black and white scheme
- bika.coa - Collection of COA templates
- bika.extras - Collection of smaller refinements not substantial enough for their own releases
- bika.reports - First drive to reserect Bika Managment Reports. Some interesting new ones, the rest being refactored

### Available, to be integrated
These should come preinstalled in next upgrades. Available in their own repos, see the Manifest below
- senaite.queue - Background processing
- bika.qmanager - Allows lab managers to set analysis volume ceilings for switching to background processing
- senaite.batch.invoices - Issues invoices per Batch
- senaite.receivedemail - Posts a ‘Sample received’ email to client on sample receipt

### Quick Start -  Docker Compose

#### 1. Clone the repository
```bash
git clone https://github.com/bikalims/bika.lims.git
cd bika.lims/4.0.0
```
#### 2. Start the stack
```bash
docker compose up -d
```
Your Bika LIMS instance will be available at: http://localhost:8081/bikalims/ (or the host machine’s IP/domain)
User admin / admin

### Change the admin password
Please see [Changing the admin password](https://www.bikalims.org/manual/technical/change-the-servers-admin-password)

### Configuration
Your new LIMS wil be functional but empty, ready for you to configure. See the [Configuration](https://www.bikalims.org/manual/setup-and-configuration) chapter in the manual, specifically [Order of Configuration](https://www.bikalims.org/manual/setup-and-configuration/order-of-configuration). Our upgrade will include a set of spreadsheets to upload a sandpit set.

### Upgrading

#### 1. Pull the latest release. Rebuild and Restart:
```bash
docker compose pull && docker compose up -d --build
```
#### 2. Upgrade the add-ons on the Add-ons setup page
Use the Admin Setup screen to navigate to add-ons, /bikalims/prefs_install_products_form, and press the [Upgrade] buttons for the add-ons that require upgrading

**NB** For major upgrades, check the Release Notes for special instructions.

### Component Versions

| Component                    | Version | License | Upstream Source |
|------------------------------|---------|---------|-----------------|
| senaite.core                 | 2.7.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.core) |
| senaite.app.listing          | 2.7.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.app.listing) |
| senaite.lims                 | 2.7.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.lims) |
| senaite.impress              | 2.7.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.impress) |
| senaite.storage              | 2.7.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.storage) |
| bika.ui                      | 1.0.0 | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.ui) |
| bika.coa                     | 2.7.0 | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.coa) |
| senaite.instruments          | 2.0.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.instruments) |
| senaite.sampleimporter       | 1.0.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.sampleimporter) |
| senaite.timeseries           | 1.0.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.timeseries) |
| senaite.samplepointlocations | 1.0.0 | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.samplepointlocations) |
| bika.extras                  | 1.0.0 | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.extras) |
| senaite.crms                 | 1.0.0 | GPL-2.0 | [GitHub](https://github.com/bikalims/senaite.crms) |
| senaite.reports              | 2.0.0 | GPL-2.0 | [GitHub](https://github.com/bikalims/bika.reports) |

### Licence
This repository’s Docker packaging and documentation are licensed under the GPL-2.0 (see LICENSE).
All bundled upstream components retain their original licenses.
License files for each component are included in their own repos.

### Resources
- [Bika LIMS GitHub Source Repository](https://github.com/bikalims)
- [Senaite GitHub Source Repository](https://github.com/senaite)
- [Docker Hub Images](https://hub.docker.com/u/bikalims)
  
### Support
- [Join the Bika Slack room](mailto:info@bikalabs.com?subject=Please%20subscribe%20me%20to%20Bika%20Slack)
- [Report issues, request improvements](https://bika.atlassian.net/jira/dashboards/10000)

###  Disclaimer
This repository does not contain the source code of Bika LIMS itself.
It is a packaging and deployment solution designed to make running Bika LIMS in Docker easy and consistent.
