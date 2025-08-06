### 🐳 Ingwe Bika LIMS 4 – Docker Suite

This repository provides an official Docker-based distribution of [Bika Open Source LIMS](https://www.bikalims.org).

Ingwe is a powerful, feature‑rich laboratory information management system built on the rock‑solid foundation of Senaite 2.6. At its core, Ingwe shares Senaite’s modern architecture, clean UI, robust API, and proven modularity. But Ingwe goes further. Professionally supported by [Bika Lab Systems](https://bikalabs.com), Bika and Senaite LIMS service provider since 2002, Ingwe delivers more than a platform — it delivers two decades of deep domain expertise, innovation, and commitment to your lab’s success.

With Ingwe, you get all of Senaite’s core strengths, plus extensive enhancements and refinements commissioned by forward‑thinking laboratories and maintained by the Bika team. The result is a more capable and more efficient LIMS — backed by dedicated support from the people who have been perfecting laboratory solutions for over 20 years.

💡 The release contains only Docker packaging, deployment scripts, and documentation – not the application source code which lives in their own repositories.

**NB Full installations** are better suited for development environments, and including a load balancer, for production environments.  Please see the [Installation Manual](https://github.com/bikalims/bika.documentation/blob/main/docs/BikaSenaiteServerIntroduction.md).

### 📦 What is included?

#### Core System
- senaite.core – The main framework providing the foundation for Senaite/Bika LIMS
- senaite.app.listing – ReactJS listing component for modern, dynamic listings
- senaite.lims – Meta package installing all required dependencies for Senaite/Bika LIMS
- senaite.impress – Rendering of Certificates of Analysis (COAs) to PDF
- senaite.queue – Background processing.

#### Bika-managed Add‑ons
- bika.ui – Makes branding the LIMS easier and restores Bika iconography to replace default black and white scheme
- senaite.instruments – Collection of instrument interfaces, updated regularly
- senaite.sampleimporter – Bulk Sample Imports from spreadsheets
- senaite.batch.invoices – Issues invoices per Batch
- senaite.timeseries – Enables tabled and graphed Time Series results
- senaite.samplepointlocations – Two‑tier Sample Point structure, per Location
- bika.qmanager – Allows lab managers to set analysis volume ceilings for switching to background processing
- bika.extras – Collection of smaller tweaks not substantial enough for their own releases
- senaite.crms – Improved reference sample management
- senaite.receivedemail – Posts a ‘Sample received’ email to client on sample receipt

#### Lab Discipline‑Specific Branches
- bika.aquaculture – Aquaculture laboratory workflows and reporting
- bika.cement – Cement laboratory testing workflows and result handling
- bika.wine – Wine laboratory workflows, chemistry, and sensory analysis

### 🚀 Quick Start

#### 1. Clone the repository
```bash
git clone https://github.com/YOUR-ORG/bika.lims.git
cd bika.lims
```

#### 2. Configure environment

```bash
cp .env.example .env
```
Edit `.env` as needed for your environment

#### 3. Start the stack
```bash
docker compose up -d
```
📍Your Bika LIMS instance will be available at: http://localhost (or the host machine’s IP/domain)
## Activate Add‑on Products in the UI
To complete your installation, activate your desired add‑ons via Site Setup in the Bika LIMS UI.  Follow the guide here: [Installing Add‑on Products Manual](http://Installing-Add-on-Products-Manual.md)

### 🔄 Upgrading

1. Pull the latest release:
```bash
git pull origin main
```

2. Rebuild and restart:
```bash
docker compose pull && docker compose up -d --build
```
For major upgrades, check the Release Notes for special instructions.
### 📋 Component Versions

| Component                    | Version | License | Upstream Source |
|------------------------------|---------|---------|-----------------|
| senaite.core                 | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.core) |
| senaite.app.listing          | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.app.listing) |
| senaite.lims                 | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.lims) |
| senaite.queue                | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.queue) |
| senaite.impress              | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.impress) |
| bika.ui                      | latest  | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.ui) |
| senaite.instruments          | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.instruments) |
| senaite.sampleimporter       | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.sampleimporter) |
| senaite.batch.invoices       | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.batch.invoices) |
| senaite.timeseries           | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.timeseries) |
| senaite.samplepointlocations | latest  | GPL-2.0 | [GitHub](https://github.com/senaite/senaite.samplepointlocations) |
| bika.qmanager                | latest  | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.qmanager) |
| bika.extras                  | latest  | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.extras) |
| senaite.crms                 | latest  | GPL-2.0 | [GitHub](https://github.com/bikalims/senaite.crms) |
| senaite.receivedemail        | latest  | GPL-2.0 | [GitHub](https://github.com/bikalims/senaite.receivedemail) |
| bika.aquaculture             | latest  | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.aquaculture) |
| bika.cement                  | latest  | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.cement) |
| bika.wine                    | latest  | GPL-2.0 | [GitHub](https://github.com/bikalabs/bika.wine) |

### 📜 Licence
This repository’s Docker packaging and documentation are licensed under the GPL-2.0 (see LICENSE).
All bundled upstream components retain their original licenses.
License files for each component are included in their own repos.

### 📚 Resources
- [Bika LIMS GitHub Source Repository](https://github.com/bikalims)
- [Senaite GitHub Source Repository](https://github.com/senaite)
- [Docker Hub Images](https://hub.docker.com/u/bikalims)
  
### 🤝 Contributing. Support
- [Report issues, request improvements](https://bika.atlassian.net/jira/dashboards/10000)
- [Join the Bika Slack room](mailto:info@bikalabs.com?subject=Please%20subscribe%20me%20to%20Bika%20Slack)
  
### ⚠️ Disclaimer
This repository does not contain the source code of Bika LIMS itself.
It is a packaging and deployment solution designed to make running Bika LIMS in Docker easy and consistent.
