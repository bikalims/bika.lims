# Bika LIMS - Production Backup and Restore Procedure

> **Scope:** Production Bika LIMS / SENAITE installations using Plone, ZODB, ZEO and BlobStorage. This guide focuses on buildout-managed installations, not Docker Compose volumes or container-specific backup commands.
>
> **Safety:** Example commands must be checked against the installed package versions, buildout configuration, storage topology and service manager. Test restoration on an isolated instance before using any procedure on production.

## Contents

1. [Introduction](#1-introduction)
2. [Backup Options](#2-backup-options)
   - [2.1 Option A - Local Backups](#21-option-a---local-backups)
   - [2.2 Option B - Local Backups with Remote Storage or Replication](#22-option-b---local-backups-with-remote-storage-or-replication)
   - [2.3 Option C - Managed Hosting or Infrastructure Administration](#23-option-c---managed-hosting-or-infrastructure-administration)
   - [2.4 Comparison of Backup Options](#24-comparison-of-backup-options)
   - [2.5 Selecting a Backup Strategy](#25-selecting-a-backup-strategy)
3. [Disaster Recovery](#3-disaster-recovery)
4. [Backup Maintenance and Best Practices](#4-backup-maintenance-and-best-practices)
5. [Roles and Responsibilities](#5-roles-and-responsibilities)
6. [Troubleshooting](#6-troubleshooting)
7. [References and Additional Documentation](#7-references-and-additional-documentation)

# 1. Introduction

## 1.1 Purpose

This guide describes how to configure, maintain and restore backups for production Bika LIMS installations, and how to allocate operational responsibilities. It is intended for system administrators, hosting providers, technical support teams and client representatives.

## 1.2 Scope

- ZODB database and BlobStorage backups
- Automated scheduling, compression and retention
- Local and off-server backup storage
- ZODB replication as an optional approach
- Managed hosting and infrastructure administration
- Restoration, verification and disaster recovery

The document does not replace the installation-specific runbook, nor does it cover every Docker or cloud backup implementation.

## 1.3 Backup and Recovery Considerations

The appropriate strategy depends on client infrastructure, technical resources, storage capacity, security obligations and recovery objectives. Local backups help with rollback; independent off-server copies protect against loss of the server or its storage. Replication is not a substitute for retained historical backups.

**Key principle:** A recoverable Bika LIMS backup must account for both the ZODB database and its associated BlobStorage. Treat a verified backup run as one recovery set and record the relationship between its components.

# 2. Backup Options

## 2.1 Option A - Local Backups

### 2.1.1 Overview, Advantages and Limitations

Local backups keep database and BlobStorage recovery data on the production server or its locally attached storage. The [`collective.recipe.backup`](https://github.com/collective/collective.recipe.backup) buildout recipe provides:

- Incremental database backups and full snapshots
- Separate BlobStorage backups
- Compressed archive backups suitable for transfer
- Automation through scheduled commands and configurable retention
- Restoration from available recovery points

Local backups support recovery from accidental changes, failed upgrades and application errors. They do **not** protect against complete loss of the server or local backup storage. They also consume space and, depending on backup method and filesystem, inodes. See Options B and C for independent recovery copies.

### 2.1.2 Prerequisites

- SSH access to the production server and appropriate permissions
- Access to the active production buildout configuration
- Knowledge of the actual ZODB and BlobStorage paths
- Adequate capacity, free inodes and a change window
- An approved backup policy and designated administrator

**Step 1 - Connect to the server.**

```bash
ssh <username>@<server-address>
```

**Step 2 - Navigate to the instance directory.**

```bash
cd /path/to/bika-instance
```

**Step 3 - Identify storage locations.** The following are examples only; confirm against the active ZEO/storage configuration:

```text
var/filestorage/Data.fs
var/blobstorage/
```

**Step 4 - Check capacity and inode availability.**

```bash
df -h
df -i
```

### 2.1.3 Configuring `collective.recipe.backup`

See the [official recipe documentation](https://github.com/collective/collective.recipe.backup).

**Step 1 - Review the active buildout file.**

```bash
nano <production-config>.cfg
```

**Step 2 - Add the backup part without replacing existing parts.** The following assumes an existing buildout with an appropriate parts declaration. Adapt it to how that buildout extends or assembles its configuration.

```ini
[buildout]
parts +=
    backup

[backup]
recipe = collective.recipe.backup
enable_zipbackup = true
```

Ensure the recipe detects the correct ZEO database and BlobStorage. Its usual directories, when the part is named `backup`, are:

| Backup type | Typical default location |
|---|---|
| Regular database | `var/backups/` |
| Regular BlobStorage | `var/blobstoragebackups/` |
| Database snapshots | `var/snapshotbackups/` |
| BlobStorage snapshots | `var/blobstoragesnapshots/` |
| Database archives | `var/zipbackups/` |
| BlobStorage archives | `var/blobstoragezips/` |

If the buildout part is named differently or paths are overridden, generated script names and directories may also differ. Confirm the installed recipe version and compatibility with the target Plone/Python/ZODB stack rather than adopting the latest recipe release automatically.

**Step 3 - Run the approved production buildout only after reviewing dependency pins and the proposed changes.**

```bash
bin/buildout -c <production-config>.cfg
```

**Step 4 - Confirm generated scripts.**

```bash
ls -l bin/backup bin/restore
ls -l bin/snapshotbackup bin/snapshotrestore
ls -l bin/zipbackup bin/ziprestore
```

### 2.1.4 Configuring Automated Backups and Database Packing

The team uses [`z3c.recipe.usercrontab`](https://pypi.org/project/z3c.recipe.usercrontab/) to install scheduled jobs through buildout. The example below runs a regular backup on Sunday at 02:00 and packing on Sunday at 04:00 (server local time). These times are **illustrative**, not a recommended production frequency or a guarantee that backup has finished before packing.

**Step 1 - Add or extend the cron parts in the active buildout.**

```ini
[buildout]
parts +=
    backupcronjob
    packcronjob

[backupcronjob]
recipe = z3c.recipe.usercrontab
times = 0 2 * * 0
command = ${buildout:directory}/bin/backup -q

[packcronjob]
recipe = z3c.recipe.usercrontab
times = 0 4 * * 0
command = ${buildout:directory}/bin/zeopack
```

**Step 2 - Validate the packing command.** `bin/zeopack` may not be generated in every ZEO deployment, and it may require additional arguments. Verify the configured pack age and the correct storage target. Packing removes older ZODB revisions; **packing is not a backup**.

**Step 3 - Apply the reviewed buildout configuration and inspect the installed jobs.**

```bash
bin/buildout -c <production-config>.cfg
crontab -l
```

**Step 4 - Check monitoring and scheduling.** Choose backup frequency from the agreed RPO; schedule ZODB packing separately and avoid simultaneous runs. Confirm that jobs run under the intended user and that output/errors are captured and monitored.

### 2.1.5 Backup Compression and Retention

The recipe offers different backup styles:

```bash
# Regular (normally incremental) database and BlobStorage backup
bin/backup

# Full snapshot without altering the normal incremental cycle
bin/snapshotbackup

# Full compressed database backup and separate BlobStorage tar archive
bin/zipbackup
```

For regular backups, `keep` controls the number of full backup generations retained, including their incrementals. For example:

```ini
[backup]
keep = 2
```

The count is **not** a number of weeks. BlobStorage retention also has recipe/version-specific behaviour; verify the installed settings.

**Important for Option B:** `zipbackup` is designed for a portable full snapshot and, under the recipe's documented behaviour, retains **only one local ZIP backup set**, overriding the normal `keep` setting. Do not rely on `keep = 2` to preserve multiple historical ZIP archives. Implement independent versioned retention at the remote destination before another local ZIP backup replaces the previous one.

### 2.1.6 Running and Verifying Backups

**Step 1 - Run an approved manual regular backup.**

```bash
bin/backup
```

**Step 2 - Check the output directories.**

```bash
ls -lah var/backups/
ls -lah var/blobstoragebackups/
```

**Step 3 - Check storage consumption.**

```bash
du -sh var/backups/ var/blobstoragebackups/
df -h
df -i
```

**Step 4 - Review the command output, errors, and whether both database and BlobStorage were backed up.** A file's existence is not proof of recoverability. Periodically restore a matched set in an isolated environment.

### 2.1.7 Restoring Bika LIMS from Local Backups

> **Warning:** A restore overwrites data. Obtain the required authorisation, identify the exact recovery point, preserve existing storage and stop the appropriate ZEO and application processes before any production restore.

1. Identify whether the required backup is a regular, snapshot or archive set.
2. Stop incoming traffic and scheduled processes. Stop application clients and the ZEO storage service according to the installation's runbook.
3. Inspect the installed restore command's help/options and select **only one** of the following commands for the selected type:

```bash
# Regular backup
bin/restore

# Snapshot backup
bin/snapshotrestore

# Compressed archive backup
bin/ziprestore
```

A date-specific regular restore may be supported for retained recovery points:

```bash
bin/restore YYYY-MM-DD-HH-MM-SS
```

Confirm date/time conventions and exact syntax against the installed recipe. `ziprestore` normally restores the available ZIP backup set; it does not provide historical archive selection without the intended files being staged first.

4. Restart ZEO first, then application clients and other dependent services.
5. Verify users, samples, analyses, attachments, COAs and service logs against the agreed recovery point.
6. Record the operation and obtain the client's acceptance before reopening normal processing.

## 2.2 Option B - Local Backups with Remote Storage or Replication

### 2.2.1 Overview, Advantages and Limitations

Option B extends the local backup procedure in Section 2.1 by maintaining additional copies of completed backup archives on a separate server. It retains the local backup capabilities of Option A, while providing a recovery source if the production server or its local storage is lost.

Two approaches are considered:

- **Remote backup storage:** Generate database and BlobStorage archives using `bin/zipbackup` and transfer the completed archives to another server. This is the established approach used by the Bika LIMS team on relevant production installations.
- **ZODB replication:** Optionally maintain a secondary database using a mechanism such as ZRS. Replication requires separate validation and does not replace versioned backups.

**Advantages:** Independent recovery copies, configurable remote retention, and reduced exposure to single-server failure.

**Limitations:** Additional storage, secure connectivity, transfer monitoring, and periodic restoration testing are required. Replication adds operational complexity.

### 2.2.2 Local Backup Configuration (Option A)

Complete the local backup configuration described in Section 2.1, including archive support:

```ini
[backup]
recipe = collective.recipe.backup
enable_zipbackup = true
```

Run the archive backup from the production instance:

```bash
bin/zipbackup
```

With the recipe's usual default layout, database archives and BlobStorage archives are held separately:

```text
var/zipbackups/
var/blobstoragezips/
```

Confirm the actual paths and archive naming against the installed recipe and buildout configuration. **Both the database archive and the corresponding BlobStorage archive are required for a complete recovery.**

### 2.2.3 Remote Backup Requirements

Provide a separate backup server or storage destination with sufficient capacity, restricted SSH access, secure network connectivity, a dedicated backup account, independent retention and monitoring.

On the remote server, create a restricted base directory for archived recovery sets:

```bash
ssh <backup-user>@<remote-server>
mkdir -p /path/to/remote/backups
```

A recommended layout uses a separate timestamped directory for each completed recovery set, containing `database/` and `blobstorage/` subdirectories. Create a new destination for every backup run; avoid overwriting historical archives.

Configure key-based SSH authentication for the account running backups, using an approved key-management process. For a new key, an illustrative command is:

```bash
ssh-keygen -t ed25519
ssh-copy-id <backup-user>@<remote-server>
```

Restrict the backup account to the permissions it needs. Protect private keys and avoid using unrestricted privileged accounts for routine transfers.

### 2.2.4 Transferring Backups to Another Server

**Step 1 - Create a completed archive backup.**

```bash
bin/zipbackup
```

Check the command's exit status and logs. Do not begin transferring a backup while its archives are still being written.

**Step 2 - Create a unique remote destination for this backup run.**

```bash
BACKUP_ID=$(date -u +%Y%m%dT%H%M%SZ)
ssh <backup-user>@<remote-server> \
    "mkdir -p /path/to/remote/backups/$BACKUP_ID/database /path/to/remote/backups/$BACKUP_ID/blobstorage"
```

**Step 3 - Transfer database and BlobStorage archives to that same recovery set.**

```bash
rsync -avh \
    var/zipbackups/ \
    <backup-user>@<remote-server>:/path/to/remote/backups/$BACKUP_ID/database/

rsync -avh \
    var/blobstoragezips/ \
    <backup-user>@<remote-server>:/path/to/remote/backups/$BACKUP_ID/blobstorage/
```

Run these commands from the production instance directory, within one controlled backup workflow. `BACKUP_ID` must remain the same for both transfers.

These commands illustrate manual transfers, not a complete production automation solution. The two archive types should be treated as one recovery set. Preserve each completed recovery set under a dated or otherwise versioned remote destination. The recipe normally keeps only the latest local ZIP backup set, so do not depend on local retention for historical archive copies.

**Step 4 - Verify the transfer.**

```bash
ssh <backup-user>@<remote-server> \
    "ls -lah /path/to/remote/backups/$BACKUP_ID/database/ /path/to/remote/backups/$BACKUP_ID/blobstorage/"
```

Compare archive sizes and, where possible, cryptographic checksums between the source and destination. Confirm that the two archives represent the intended recovery point.

### 2.2.5 Automating and Verifying Remote Backups

Automate the following sequence as a coordinated workflow:

1. Run `bin/zipbackup`.
2. Confirm successful completion before proceeding.
3. Transfer the database and BlobStorage archives.
4. Verify transferred files and mark the recovery set complete only after both succeed.
5. Record the result and notify the responsible administrator of failures.

The workflow may be scheduled with `z3c.recipe.usercrontab`, as described in Section 2.1.4. Avoid scheduling the archive job and transfer job as unrelated cron entries with an assumed fixed completion gap.

The team's deployment-specific transfer scripts are intentionally not included in this client document.

**Retention:** Preserve multiple historical recovery points under independently versioned remote paths, as `zipbackup` normally retains only the latest local ZIP set. Define a remote retention policy independent of local cleanup.

**Monitoring:** Check archive age, backup job exit status, transfer status, storage availability, integrity checks and alerts. A completed transfer is not proof that a restore will succeed.

### 2.2.6 ZODB Replication as an Alternative

ZRS (`zc.zrs`) can be considered where the deployment requires a replicated ZODB storage service. Its compatibility with the installed ZODB, ZEO, Plone and BlobStorage components must be tested before production use.

The Bika LIMS team encountered difficulties establishing reliable replication on Plone 5.2 and instead used remote archive transfers. Other deployments have reported successful replication, so this experience should not be interpreted as a general incompatibility.

Before adopting replication, administrators should verify:

- Compatible package versions and supported storage topology.
- Primary and secondary server configuration.
- Replication health and lag monitoring.
- Correct handling and recovery of BlobStorage.
- Failover and recovery procedures tested in a non-production environment.
- Independent versioned backups retained alongside replication.

**Replication is not a substitute for backups.** Unwanted changes or corruption may also reach a replica.

Reference: [zc.zrs on PyPI](https://pypi.org/project/zc.zrs/).

### 2.2.7 Restoring Bika LIMS from Remote Backups

**Step 1 - Select a recovery point.** Identify a matching database and BlobStorage archive set and confirm its integrity.

**Step 2 - Prepare the target environment.** Confirm application and package compatibility, available storage and a suitable maintenance window. Preserve the existing database and BlobStorage before overwriting them.

**Step 3 - Retrieve the database archives.** Set `BACKUP_ID` to the *verified* remote recovery set identifier, rather than generating a new date:

```bash
BACKUP_ID=<verified-backup-id>
rsync -avh \
    <backup-user>@<remote-server>:/path/to/remote/backups/$BACKUP_ID/database/ \
    var/zipbackups/
```

**Step 4 - Retrieve the BlobStorage archives.**

```bash
rsync -avh \
    <backup-user>@<remote-server>:/path/to/remote/backups/$BACKUP_ID/blobstorage/ \
    var/blobstoragezips/
```

Stage only the selected archives in the restore directories; move unrelated or newer local ZIP archives out of the way safely so that `ziprestore` cannot select the wrong recovery set.

**Step 5 - Stop the relevant services and restore.** With the application and storage services stopped according to the deployment's operating procedure, inspect the configured restore options and select the required backup:

```bash
bin/ziprestore
```

Verify the installed recipe's restore syntax and backup selection before executing a production restore. Do not restore against an active production database.

**Step 6 - Restart and verify.** Start the storage service before application clients, then confirm login, clients, samples, analyses, attachments and the expected recovery point.

**Step 7 - Record the recovery.** Document the selected backup, administrator, start and end times, verification results and any remaining issues.

## 2.3 Option C - Managed Hosting or Infrastructure Administration

### 2.3.1 Overview, Advantages and Limitations

Under Option C, a managed hosting provider or a designated infrastructure administrator is responsible for implementing, operating and monitoring the agreed backup and recovery arrangements.

This **does not require changing hosting companies**. A client's existing internal or contracted administrator may provide the service.

The underlying solution may use local backups, off-server archives, snapshots or other technologies, provided that a consistent ZODB database and BlobStorage recovery can be demonstrated.

**Advantages:** Specialist administration, centralised monitoring, defined operational ownership and reduced day-to-day infrastructure work for the application team.

**Limitations:** Potential additional cost, dependency on the provider's responsiveness and the need for a clear service agreement.

**Important:** Managed hosting does not automatically guarantee appropriate backups. Scope, retention, monitoring and recovery testing must be confirmed.

### 2.3.2 Hosting Provider Responsibilities

The hosting provider's agreed responsibilities should include:

- Maintaining the production server and its storage.
- Configuring and monitoring scheduled backups.
- Backing up both ZODB and BlobStorage consistently.
- Maintaining off-server copies and retention.
- Monitoring backup failures, capacity and filesystem health.
- Managing firewalls, operating system security and administrative access.
- Supporting restoration tests and disaster recovery.
- Reporting backup status and incidents to the client.

A general-purpose virtual machine snapshot is not necessarily an application-consistent backup. The provider should demonstrate how the database and BlobStorage are restored together.

### 2.3.3 Infrastructure Administrator Responsibilities

An internal or contracted administrator can carry out the same responsibilities as a managed hosting provider. Relevant skills include Linux administration, storage and filesystems, network security, backup automation and disaster recovery.

The infrastructure administrator should coordinate with the Bika LIMS technical team on application-specific dependencies, database and BlobStorage locations, service startup order and validation of restored laboratory data.

Unless separately agreed, infrastructure administration remains the responsibility of the appointed administrator, while the Bika LIMS team provides application-specific support.

### 2.3.4 Backup Scheduling, Storage and Retention

The provider or administrator should agree with the client on:

- Backup frequency and whether full and incremental backups are used.
- Consistency between the database and BlobStorage recovery points.
- Local and independent off-server storage destinations.
- Retention periods and historical recovery points.
- Monitoring, failure notifications and restoration request procedures.

Frequency should be based on the laboratory's acceptable data loss. For example, daily backups may be more appropriate than weekly backups for a laboratory processing samples every day. The agreed recovery point objective determines the required frequency.

Remote copies should be protected against accidental deletion and should not simply mirror the latest local state.

### 2.3.5 Firewall, Security and Server Maintenance

The responsible administrator should maintain firewall rules, limit unnecessary network exposure, restrict SSH and privileged access, apply operating system security updates, review logs and monitor disk space and filesystem health.

Backup data may contain confidential client and laboratory information. Apply restricted access, secure transfers, protected credentials and encryption where required by the client's security policy.

### 2.3.6 Backup Monitoring and Restoration

Monitor backup completion, missed jobs, backup age, integrity, remote transfer status, retention cleanup and available storage.

Periodically restore a backup into a separate test environment and verify:

1. The ZODB database restores successfully.
2. BlobStorage matches the restored database.
3. Bika LIMS starts and users can authenticate.
4. Clients, samples and analyses are accessible.
5. Documents and attachments open successfully.

Define who can request and authorise a restore, who performs it and how the result is confirmed.

### 2.3.7 Disaster Recovery Responsibilities

The provider or administrator should maintain a documented procedure for production server failure, storage failure, database or BlobStorage corruption, accidental deletion and recovery to replacement infrastructure.

A typical sequence is:

1. Assess the incident and identify affected systems.
2. Select a suitable recovery point.
3. Prepare replacement or recovery infrastructure.
4. Restore application dependencies and configuration.
5. Restore matching ZODB and BlobStorage data.
6. Start the services and coordinate application verification.
7. Confirm readiness for production and document the outcome.

**Recovery Point Objective (RPO):** The maximum acceptable amount of data loss, expressed as time since the last recoverable point.

**Recovery Time Objective (RTO):** The target duration for restoring service after a disruption.

The client and provider should agree realistic RPO and RTO targets, along with responsibilities for backup management, monitoring, authorisation, restoration and application verification.

## 2.4 Comparison of Backup Options

The following comparison assumes each option is implemented as described. Actual capabilities depend on the deployment and service agreement.

| Capability | Option A - Local | Option B - Remote / Replication | Option C - Managed |
| --- | --- | --- | --- |
| Automated backups | Yes | Yes | As agreed |
| Database and BlobStorage backups | Yes | Yes | Required in scope |
| Archive and historical backups | Yes | Yes | As agreed |
| Local rollback | Yes | Yes | As agreed |
| Independent off-server copies | No, not by itself | Yes, with remote archives | Should be required |
| Optional ZODB replication | No | Possible, if validated | Possible, if agreed |
| Recovery after total production server loss | Not from local copies alone | Yes, if remote copies survive | Yes, if recovery is included and tested |
| Backup monitoring | Internal team | Internal team | Provider / administrator |
| Infrastructure maintenance | Internal team | Internal team | Provider / administrator |
| Operational complexity for client | Moderate | Higher | Lower if fully delegated |

**Interpretation:** Option A provides local recovery but not protection against loss of the server. Option B adds independently stored recovery points. Option C delegates implementation and ongoing operation to an agreed provider or administrator; its technical protection must be confirmed rather than assumed.

## 2.5 Selecting a Backup Strategy

The appropriate option depends on the laboratory's operational requirements, available technical resources and acceptable downtime and data loss.

**Choose Option A** where local rollback is the immediate requirement and the client accepts that same-server backups cannot recover from complete server loss. It is best treated as a baseline rather than a complete disaster recovery strategy.

**Choose Option B** where the organisation maintains its own infrastructure and needs recoverable off-server copies. The established approach is to transfer completed `zipbackup` database and BlobStorage archives, with independent remote versioning, retention and regular restore testing.

**Choose Option C** where the client has a capable infrastructure administrator or prefers managed hosting. Confirm that the service agreement explicitly covers application-consistent backups, off-server retention, monitoring, restoration tests and disaster recovery.

Before selecting an option, agree on the **RPO**, **RTO**, retention requirements, backup ownership and a schedule for restoration testing. Regardless of the chosen option, a backup should only be considered dependable after a successful test restoration.

# 3. Disaster Recovery

This chapter describes how to recover a production Bika LIMS installation after server failure, data loss or corruption. It applies to installations using Plone, ZODB, ZEO and BlobStorage. Commands are examples and must be adapted to the actual deployment, service names and buildout configuration.

**Recovery principles**

- Obtain authorisation before any operation that overwrites production data.
- Record the incident, time of failure, last known successful transaction and selected recovery point.
- Preserve the failed server's disks, database and BlobStorage where possible for investigation and potential recovery.
- Restore the ZODB database and its corresponding BlobStorage backup as one recovery set.
- Keep the recovery environment isolated from production traffic until verification is complete.
- Confirm the recovery point objective (RPO) and recovery time objective (RTO) with the client. Do not promise recovery times until tested.

## 3.1 Production Server Failure

### Step 1 - Assess and contain the incident

Determine whether the problem affects the application clients, ZEO storage service, database files, BlobStorage, filesystem, network or the entire server. A service outage does not always require a data restore.

If corruption, intrusion or unintended changes are suspected, restrict access and preserve relevant logs and evidence before making changes. Do not immediately restart or overwrite affected storage.

### Step 2 - Identify the recovery source

Select the latest *verified and suitable* recovery point from:

1. Local backups, if the original storage is still accessible.
2. Remote database and BlobStorage archives, if the production server or disk is unavailable.
3. The hosting provider's or infrastructure administrator's recovery facility, if Option C is in use.

Confirm that both database and BlobStorage components exist and correspond to the same backup run. Check archive integrity and any known backup errors.

### Step 3 - Prepare the target environment

Repair the existing server or provision replacement infrastructure. Confirm the operating system, Python runtime, Plone/SENAITE/Bika packages, buildout configuration, ZEO storage settings, BlobStorage path, add-ons and required secrets or external integrations are compatible with the selected backup.

A database and BlobStorage backup alone does not recreate the complete application environment. Configuration files, package versions, certificates, secrets and service definitions must also be recoverable through an approved process.

Check available capacity and inode availability where relevant:

```bash
df -h
df -i
```

### Step 4 - Plan the cutover

Notify affected users, establish a maintenance window and ensure that no application clients or background jobs can write to the database during restoration. If restoring to a replacement server, plan DNS, proxy, firewall and application endpoint changes separately.

## 3.2 Recovering from Local Backups

Use this procedure when the backup directories remain accessible on the production server or a surviving attached volume.

### Step 1 - Confirm the backup set

From the Bika LIMS instance directory, inspect the configured backup locations. The paths below are typical defaults, not guaranteed paths for every installation:

```bash
cd /path/to/bika-instance
ls -lah var/backups/ var/blobstoragebackups/
ls -lah var/zipbackups/ var/blobstoragezips/
```

Use the backup method that matches the available files: regular, snapshot or ZIP/archive backups. Select the corresponding database and BlobStorage recovery point.

### Step 2 - Stop services and preserve current data

Stop incoming traffic and scheduled jobs. Stop the application clients and ZEO storage services using the deployment's service manager, for example Supervisor, systemd or the instance's management scripts. Confirm that no processes still have the target storage open.

Preserve the existing database and BlobStorage in a separate, clearly labelled location before overwriting them, provided this is safe and sufficient storage exists. Do not confuse this preservation copy with a verified backup.

### Step 3 - Restore the selected backup

Run the restore command appropriate to the backup type:

```bash
# Regular backup
bin/restore

# Snapshot backup
bin/snapshotrestore

# Archive backup
bin/ziprestore
```

**Do not run all three commands.** Choose only the command matching the selected recovery set. Review the installed `collective.recipe.backup` help and configuration for selecting a specific historical backup, interactive prompts and the actual database/BlobStorage restore behaviour. Confirm the target paths before accepting any overwrite.

### Step 4 - Restart services

Start ZEO storage services first, confirm they are healthy, and then start the application clients and any required workers. Re-enable proxy traffic and scheduled jobs only after verification in Section 3.5.

## 3.3 Recovering from Remote Backups

Use this procedure when the local backups are missing, inaccessible or not trustworthy. Under Option B, the established method is to copy completed `bin/zipbackup` output to a separate backup server.

### Step 1 - Locate and verify the remote archives

Identify a matching database archive and BlobStorage archive for the intended recovery point. Confirm their sizes and, where available, compare checksums with recorded values. Do not assume that the most recent uploaded file represents a completed backup set.

### Step 2 - Prepare a compatible Bika LIMS instance

Provision the target server and recover the application code, buildout configuration, secrets and service definitions through the approved infrastructure process. Verify that the required backup directories exist and have appropriate permissions.

### Step 3 - Retrieve the archives

The following commands illustrate retrieving a verified, timestamped recovery set. Choose the actual `BACKUP_ID` from the remote backup inventory:

```bash
cd /path/to/bika-instance
BACKUP_ID=<verified-backup-id>

rsync -avh \
    <backup-user>@<remote-server>:/path/to/remote/backups/$BACKUP_ID/database/ \
    var/zipbackups/

rsync -avh \
    <backup-user>@<remote-server>:/path/to/remote/backups/$BACKUP_ID/blobstorage/ \
    var/blobstoragezips/
```

Ensure the restore directories contain the intended selected archive set, not stale or unrelated archives, before running `bin/ziprestore`.

These examples assume the directories and remote SSH access have already been configured. Protect credentials and do not expose backup archives to public web paths.

### Step 4 - Restore and verify

Stop all relevant services, preserve existing target data if present, and restore the selected archive set using the configured `bin/ziprestore` command. Verify the actual restore selection and overwrite prompts for the installed recipe version before execution.

Restart the storage service and application clients in the correct order. Complete the checks in Section 3.5 before returning the installation to production.

### Special case - ZODB replication

Where a tested ZRS replica is available, the administrator may follow the documented replication failover or recovery procedure for that deployment. Replication must not be assumed to include BlobStorage or to provide historical recovery points. Confirm the database state, BlobStorage availability and consistency before switching users to the recovered environment.

## 3.4 Recovering Through a Hosting Provider or Infrastructure Administrator

Under Option C, the designated hosting provider or infrastructure administrator coordinates infrastructure recovery according to the agreed service arrangement.

### Step 1 - Report and classify the incident

Provide the incident time, observed symptoms, affected Bika LIMS URL or instance, and business impact. Identify the client's authorised decision-maker and the technical contact responsible for the recovery.

### Step 2 - Confirm the recovery plan

The administrator should confirm:

- The available recovery points and whether they include both ZODB and BlobStorage.
- The selected recovery point and expected data loss.
- Whether recovery will occur on the existing or replacement server.
- The estimated restoration window and any dependencies.
- Who is authorised to approve data replacement and production cutover.

### Step 3 - Restore the infrastructure and application data

The administrator restores the agreed infrastructure, application configuration and matching database/BlobStorage recovery set. The Bika LIMS technical team assists with application-specific configuration and validation where required.

### Step 4 - Verify and hand over

The administrator and Bika LIMS technical team complete the post-recovery checks, record outstanding issues and obtain the client's approval before reopening the service to normal use. The incident record should include actual data loss and recovery duration for comparison with the agreed RPO and RTO.

## 3.5 Post-Recovery Verification

A restore is not complete merely because the services start. Verify the application and the recovered laboratory data before declaring the system operational.

| Check | Expected result |
|---|---|
| Storage and application services | ZEO and application clients start without critical errors. |
| Authentication | Authorised users can log in with expected permissions. |
| Client and contact records | Records are accessible and consistent with the recovery point. |
| Samples and analyses | Representative samples, analyses, statuses and results are available. |
| Attachments and documents | Representative BlobStorage-backed files open successfully. |
| Reports and COAs | Representative reports can be generated or opened as expected. |
| Background operations | Required scheduled jobs, queues and notifications are reviewed before re-enabling. |
| Integrations | Relevant email, instrument or external integrations are checked where applicable. |
| Recovery point | Latest restored records match the selected backup date and expected RPO. |
| Logs and resources | No critical ZODB/BlobStorage errors; disk space and inode availability are adequate. |

**Completion and handover**

1. Record the selected backup set, backup timestamp, recovery start and completion times, and personnel involved.
2. Record which checks passed, any unresolved issues and any data requiring manual re-entry.
3. Obtain approval from the designated client representative to reopen production access.
4. Re-enable application traffic and scheduled jobs in a controlled manner.
5. Monitor the recovered installation and confirm that new backups complete successfully.
6. Conduct a post-incident review and update the recovery procedure where necessary.

**Safety note:** All example commands are illustrative. Test the complete restore procedure against the installed package versions and production topology before relying on it during an incident.

# 4. Backup Maintenance and Best Practices

A backup configuration requires ongoing maintenance. Administrators must verify that scheduled jobs continue to run, recovery points remain usable, and storage and security controls remain appropriate as laboratory data grows. These requirements apply to all three backup options, with responsibility assigned according to the agreed support arrangement.

## 4.1 Backup Frequency and Retention

Backup frequency should be based on the laboratory's **Recovery Point Objective (RPO)** - the maximum acceptable period of data loss. Retention should be based on the recovery points the client needs, available storage and any contractual or regulatory obligations.

For example, a laboratory that can tolerate at most 24 hours of data loss generally requires successful recoverable backups at least daily. A weekly backup would not meet that objective. The backup schedule should also account for how long the database and BlobStorage archive take to complete and, under Option B, how long remote transfers take.

**Recommended administration procedure**

1. Agree the RPO and retention requirements with the client.
2. Confirm the schedule for regular, snapshot and archive backups as applicable.
3. Confirm that database and BlobStorage data are captured as a matching recovery set.
4. Configure retention for local and remote destinations separately.
5. Verify that the oldest required recovery point remains available after cleanup.
6. Review the schedule and retention policy when data volumes or laboratory operations change.

For `collective.recipe.backup`, the following is an example of a retention setting:

```ini
[backup]
keep = 2
```

**Note:** `keep` is a count of backup generations, not a number of days or weeks. Confirm the installed recipe version's behaviour and the separate handling of regular, snapshot and archive backups before relying on this setting. Do not assume that deleting old local archives should also delete remote recovery points.

Database packing, where configured, is a separate maintenance operation. **Packing is not a backup.** Its schedule and retention of historical ZODB revisions should be reviewed independently. Avoid scheduling packing and backup jobs so that they overlap unexpectedly.

## 4.2 Storage Monitoring

Backups may fail because of insufficient disk space, exhausted inodes, filesystem errors or an inaccessible remote destination. Storage monitoring must include the production server and every backup destination.

### Step 1 - Check filesystem capacity

```bash
df -h
```

Review the filesystems containing the production database, BlobStorage, temporary archive files and backup directories. Check remote storage independently.

### Step 2 - Check inode availability

```bash
df -i
```

This is particularly important on ext4 filesystems containing large numbers of BlobStorage files or unpacked backups.

### Step 3 - Review backup directory sizes

From the Bika LIMS instance directory, where the recipe uses its default paths:

```bash
du -sh var/backups/ var/blobstoragebackups/ 2>/dev/null
du -sh var/zipbackups/ var/blobstoragezips/ 2>/dev/null
```

Actual paths depend on the buildout configuration and installed backup recipe. Missing directories do not necessarily indicate a failure if a backup type is not enabled or a custom location is configured.

### Step 4 - Review backup age and job results

```bash
ls -lah var/zipbackups/
ls -lah var/blobstoragezips/
crontab -l
```

Check timestamps, logs and exit status rather than relying on filenames alone. For Option B, confirm that both archive components arrived at the remote destination and passed the configured integrity checks.

**Operational guidance:** Establish storage warning thresholds with sufficient headroom for the next backup, archive creation, database growth and retention. A filesystem that has enough room for today's data may still be too full to create the next complete backup.

## 4.3 Filesystem and Inode Considerations

Bika LIMS BlobStorage can contain many individual files. Backups and repeated copies of these directories can significantly increase filesystem metadata requirements.

### ext4 filesystems

On ext4, the inode population is normally determined when the filesystem is created. Each file or directory consumes an inode. As a result, a filesystem can run out of available inodes even when free disk capacity remains.

The Bika LIMS team has encountered this issue on older production servers with large numbers of BlobStorage files and backup files.

Typical symptoms include:

- New files cannot be created despite available disk space.
- Backup jobs fail while writing files or creating directories.
- Application operations involving new BlobStorage objects fail.
- `df -h` reports available capacity while `df -i` reports inode exhaustion.

### ZFS filesystems

ZFS does not use ext4's fixed inode allocation model. In the team's experience, production servers using ZFS did not encounter the same inode exhaustion issue observed on ext4 servers.

This does **not** mean that ZFS has unlimited capacity. Administrators must still monitor available storage, metadata overhead, quotas and overall filesystem health.

### Reducing inode pressure

Where appropriate, administrators can:

1. Use compressed backup archives rather than retaining unnecessary expanded copies of BlobStorage.
2. Apply an agreed retention policy to remove obsolete backup generations.
3. Store remote backup copies on a separate filesystem or server.
4. Monitor inode consumption alongside disk capacity on ext4.
5. Review filesystem selection and sizing when provisioning replacement infrastructure.

**Important:** Do not delete files directly from the live BlobStorage directory to reclaim inodes. Such changes can damage the relationship between ZODB records and their stored file data. Backup cleanup must also follow the backup recipe's supported procedures and the agreed retention policy.

## 4.4 Backup Security

Bika LIMS backups can contain confidential laboratory records, client information, results and attachments. Backup storage should therefore be protected to an appropriate level for the production data.

### Access control

- Restrict access to backup directories and remote destinations to authorised users and service accounts.
- Use dedicated backup accounts with the minimum permissions required.
- Protect SSH private keys and other credentials used by automated transfers.
- Review access when staff responsibilities change.

### Transfer and storage protection

- Use secure transfer methods such as SSH-based `rsync`.
- Apply encryption at rest where required by the client's security policy.
- Keep off-server copies separate from production administration credentials where practical.
- Consider immutable or otherwise deletion-protected backup copies to reduce the impact of ransomware or accidental deletion.
- Avoid exposing backup directories through public web services.

### Integrity and auditability

- Verify that backup archives are complete before marking a backup operation successful.
- Where practical, compare cryptographic checksums after remote transfers.
- Keep logs of backup execution, transfer failures, cleanup and restoration activities.
- Restrict who can overwrite or delete historical recovery points.

Encryption and access restrictions must not prevent authorised disaster recovery. Store recovery credentials and encryption keys securely, with a documented method for retrieving them during an incident.

## 4.5 Periodic Restoration Testing

A successful backup job does not prove that the backup can be restored. Periodic testing should confirm that the ZODB database and corresponding BlobStorage can be recovered together and that Bika LIMS operates correctly afterward.

### Step 1 - Select a recovery point

Choose a representative local or remote backup set. Confirm the database and BlobStorage archives belong to the same completed backup operation.

### Step 2 - Prepare an isolated test environment

Use a non-production instance with compatible application packages and configuration. Ensure the test environment cannot send unintended emails, update external services or interfere with production data.

### Step 3 - Restore the backup

Follow the applicable restore procedure from Section 2.1.7 or Chapter 3. Verify the installed `collective.recipe.backup` commands and arguments before executing them. Do not perform a restoration test against live production storage.

### Step 4 - Verify the restored application

Check at least the following:

| Verification | Expected outcome |
|---|---|
| ZEO and application services | Start without critical errors |
| User authentication | Authorised test users can log in |
| Clients and contacts | Records are accessible |
| Samples and analyses | Representative records and results are present |
| BlobStorage attachments | Representative files open successfully |
| Reports and COAs | Representative documents can be opened or generated |
| Recovery point | Restored data matches the selected backup timestamp |
| Logs | No critical database or BlobStorage consistency errors |

### Step 5 - Record the outcome

Record the test date, backup source, recovery point, administrator, restoration duration, checks performed and any failures. Address problems and repeat the test after corrective changes.

**Recommended practice:** Test restoration after significant infrastructure or backup configuration changes, and at an agreed periodic interval. Where Option B is used, include tests that retrieve the archives from the remote destination rather than relying only on local copies.

---

# 5. Roles and Responsibilities

A reliable backup and recovery process requires clear ownership. The responsible parties must be identified before the system enters production and whenever the hosting or support arrangement changes.

Responsibilities vary according to the selected backup option. Under Options A and B, the organisation or technical team operating the infrastructure must manage the agreed backup activities. Under Option C, these duties are assigned to the hosting provider or designated infrastructure administrator, subject to the service agreement.

The Bika LIMS technical team may assist with application-specific configuration and verification, but responsibility for operating the underlying infrastructure should not be assumed unless explicitly agreed.

## 5.1 Parties Involved

### Client or Laboratory Management

The client is accountable for defining business requirements and authorising decisions that affect production data and service availability. Responsibilities include:

- Agreeing to the backup strategy, backup frequency, retention period, RPO and RTO.
- Appointing the party responsible for backup operations and infrastructure administration.
- Authorising production restoration, rollback and planned downtime.
- Providing appropriate contacts for incidents and escalations.
- Confirming that the recovered laboratory system meets operational needs before normal processing resumes.

### Infrastructure Administrator or Hosting Provider

The designated administrator or provider is responsible for the infrastructure activities assigned under the agreed arrangement. These may include:

- Configuring and scheduling database and BlobStorage backups.
- Maintaining local and, where agreed, off-server backup storage.
- Monitoring backup jobs, transfer results, storage capacity and filesystem health.
- Applying backup retention, access controls and security measures.
- Maintaining server operating systems, firewall rules and administrative access where included in scope.
- Performing approved restores and maintaining a tested disaster recovery procedure.
- Reporting backup failures and recovery progress to the client and technical team.

### Bika LIMS Technical Team

The Bika LIMS technical team provides application-specific expertise, including:

- Identifying the ZODB, ZEO and BlobStorage components that must be protected.
- Advising on application dependencies and compatible recovery environments.
- Assisting with backup recipe or application configuration where included in the support scope.
- Helping diagnose application errors after restoration.
- Verifying representative Bika LIMS functions, including samples, analyses, attachments and COAs.
- Documenting application-specific recovery requirements and changes.

Application support does not automatically include server administration, backup monitoring or disaster recovery execution.

## 5.2 Responsibility Matrix

The following matrix is a starting point for assigning ownership. It must be adapted to the client's support agreement. **Primary owner** means the party responsible for ensuring the activity is completed; other parties may provide support.

| Activity | Options A and B - Self-managed | Option C - Managed infrastructure | Client involvement |
|---|---|---|---|
| Approve backup policy, RPO and RTO | Client | Client | Primary owner |
| Configure backup jobs | Assigned internal administrator or technical team | Provider or infrastructure administrator | Approves scope |
| Monitor backup success and failures | Assigned internal administrator or technical team | Provider or infrastructure administrator | Receives escalation |
| Manage local backup storage | Assigned internal administrator or technical team | Provider or infrastructure administrator | As agreed |
| Manage off-server copies (Option B) | Assigned internal administrator or technical team | Provider or infrastructure administrator, if contracted | As agreed |
| Maintain retention and backup security | Assigned internal administrator or technical team | Provider or infrastructure administrator | Approves policy |
| Monitor disk space and inodes | Assigned infrastructure operator | Provider or infrastructure administrator | Receives escalation |
| Authorise production restoration | Client's authorised representative | Client's authorised representative | Primary owner |
| Execute approved restoration | Assigned infrastructure operator | Provider or infrastructure administrator | Coordinates downtime |
| Verify Bika LIMS application functions | Bika LIMS technical team with laboratory users | Bika LIMS technical team with laboratory users | Accepts recovery |
| Maintain server security and operating system | Assigned infrastructure operator | Provider or infrastructure administrator, if contracted | As agreed |
| Conduct restoration tests | Assigned infrastructure operator with Bika LIMS support | Provider or infrastructure administrator with Bika LIMS support | Reviews results |

**Note:** Option A has no off-server backup requirement. Option B adds remote archive storage or a separately assessed replication arrangement. Option C does not guarantee any particular backup capability unless it is included in the agreement.

## 5.3 Backup Monitoring and Incident Escalation

Every production installation should have a named primary contact and a backup contact for backup failures and recovery incidents.

When a backup or transfer fails, the responsible operator should:

1. Record the failed job, time, affected backup component and available error messages.
2. Determine whether a valid earlier recovery point is available, including the matching BlobStorage backup.
3. Assess the risk to the agreed RPO and notify the designated contact when that objective may be breached.
4. Investigate and correct the issue, involving the Bika LIMS technical team for application-specific failures.
5. Run or confirm a successful replacement backup where appropriate.
6. Record the resolution and any follow-up action.

For production outages or suspected data corruption, the administrator should preserve available evidence and backup sets, notify the client's authorised representative and follow the recovery procedure in Chapter 3. Restoration must not begin without the required authorisation, except where a pre-approved emergency procedure explicitly permits it.

## 5.4 Restoration Approval and Acceptance

The person requesting restoration, the person authorising it and the person executing it should be identifiable in the incident record.

Before restoration, confirm the selected recovery point, expected data loss, anticipated downtime and whether the current production state must be preserved for investigation or rollback.

After restoration, the infrastructure operator confirms that the services are running, the Bika LIMS technical team performs application-level checks, and the client's authorised laboratory representative confirms that normal operations may resume.

## 5.5 Review of Responsibilities

Review ownership and contact details when:

- Production hosting is migrated to a new server or provider.
- The client appoints or changes its infrastructure administrator.
- Backup tooling, storage destinations or schedules change.
- A disaster recovery test identifies a responsibility gap.
- The support or hosting agreement is renewed or revised.

Maintain a deployment-specific record of the named contacts, service coverage, backup schedule, storage locations, retention, escalation channels and recovery authorisation process. Avoid storing passwords or private keys in this document.

---

# 6. Troubleshooting

This chapter provides initial checks for common backup and recovery problems. Commands are illustrative and must be adapted to the installation's buildout, service manager, operating system and backup recipe version. Record errors and preserve existing data before attempting corrective action.

## 6.1 Backup Commands Are Missing

**Symptoms:** `bin/backup`, `bin/zipbackup` or `bin/ziprestore` is not present, or the shell reports `No such file or directory`.

**Checks:**

```bash
cd /path/to/bika-instance
ls -l bin/backup bin/zipbackup bin/ziprestore
grep -n -A 8 '^\[backup\]' buildout.cfg
```

Confirm that the active production buildout configuration includes the `backup` part and enables archive backups. Inspect any extended configuration files as well.

**Corrective action:** Correct the configuration and regenerate the scripts using the deployment's established buildout procedure. Review version pins and changes before running buildout on production, since an uncontrolled buildout may update unrelated packages. If scripts exist but fail, inspect their error output and Python environment rather than replacing them blindly.

## 6.2 Scheduled Backups Do Not Run

**Symptoms:** No new archives appear at the expected time, despite manual backups working.

**Checks:**

```bash
crontab -l
ls -lah var/zipbackups/ var/blobstoragezips/
date
```

Verify that the scheduled command uses the correct absolute path, runs under the intended account and uses the expected server timezone. Review cron logs using the logging facility available on the server, and check that the user crontab recipe was installed by the active buildout.

**Corrective action:** Correct the cron configuration and permissions, then run the backup manually to confirm it works. Capture stdout, stderr and exit status in the automated workflow, and configure failure alerts. Do not assume a scheduled job succeeded merely because it appears in `crontab -l`.

## 6.3 Backup Fails Because of Disk Space or Inode Exhaustion

**Symptoms:** `No space left on device`, incomplete archives, or failures creating new files even though some disk space appears free.

**Checks:**

```bash
df -h
df -i
du -sh var/backups var/zipbackups var/blobstoragebackups var/blobstoragezips 2>/dev/null
```

On ext4, the filesystem can run out of available inodes before it runs out of storage space, particularly where large numbers of small BlobStorage files or backup files exist. The team has encountered this on older ext4 installations; the same fixed inode allocation behaviour was not encountered on ZFS.

**Corrective action:** Identify the affected filesystem and the files consuming capacity or inodes. Apply the agreed retention policy or expand/migrate storage as appropriate. Do not manually delete ZODB files, live blobs or backup files whose retention status is unknown. Where archive backups are suitable, they can reduce the number of individual files in the backup destination, but the live BlobStorage still requires adequate filesystem capacity.

## 6.4 Database or BlobStorage Archive Is Missing

**Symptoms:** A database archive exists but its corresponding BlobStorage archive is absent, incomplete or from a different recovery point.

**Checks:**

```bash
ls -lah var/zipbackups/
ls -lah var/blobstoragezips/
```

Review the `bin/zipbackup` output and logs, archive timestamps and transfer records. Confirm that the installation actually uses BlobStorage and that the backup recipe detects the configured storage paths.

**Corrective action:** Resolve backup configuration or storage errors and generate a new complete archive set. Do not label a backup recoverable until the database and required blobs have been verified together. If the matching blob archive is unavailable, assess the consequences before attempting any partial recovery.

## 6.5 Remote Transfer Is Incomplete or Fails

**Symptoms:** The remote server lacks the latest archives, a transfer exits with an error, or archive sizes differ between servers.

**Checks:**

```bash
ssh <backup-user>@<remote-server>
df -h
```

Check SSH authentication, destination permissions, remote storage, connectivity and the transfer command's exit status. Compare checksums of the specific source and destination archives when investigating integrity.

**Corrective action:** Retry failed transfers only after the local archive creation has completed successfully. Use a workflow that publishes or marks the remote recovery point complete only after both database and BlobStorage archives are present and verified. Do not use an unqualified `rsync --delete` against a historical backup destination, as it may erase recovery points that should be retained.

## 6.6 Restoration Fails or Restores the Wrong Recovery Point

**Symptoms:** The restore command reports an error, expected data is missing, or the restored database does not match the selected backup date.

**Checks:**

- Confirm that restoration has been authorised and the target environment is correct.
- Identify the exact backup set and review the recipe's supported archive selection syntax.
- Verify that the database and BlobStorage archives belong to the same recovery point.
- Check available disk space, filesystem permissions and restore logs.
- Confirm that ZEO and application clients are stopped as required by the deployment procedure.

**Corrective action:** Preserve the pre-restore state, correct the underlying error and repeat the restore only when the selected recovery point is unambiguous. Do not assume `bin/ziprestore` automatically selects the desired historical archive; inspect its help and installed recipe version first. Never test an uncertain restore command against live production data.

## 6.7 ZEO or Application Clients Fail to Start After Recovery

**Symptoms:** ZEO fails to start, application clients cannot connect, or Bika LIMS returns errors after restoration.

**Checks:**

```bash
supervisorctl status
```

Where Supervisor is used, inspect the relevant ZEO and client logs. Verify configured storage paths, ownership, port bindings, network connectivity, Python environment and package versions. Start the storage service before dependent application clients, following the installation's service configuration.

**Corrective action:** Resolve the specific startup error rather than repeatedly restarting services. If the restored instance differs from the original server, check buildout configuration, installed add-ons and external dependencies. Escalate application-level errors to the Bika LIMS technical team after the infrastructure checks are complete.

## 6.8 Restored Application Has Missing Attachments or Unexpected Data

**Symptoms:** Users can log in, but sample attachments, documents or other records are missing, or the application reflects an unexpected recovery point.

**Checks:** Compare the restored database and BlobStorage backup identifiers and timestamps. Review restore logs for missing blob errors and confirm that the correct BlobStorage directory is configured. Test representative samples, analyses, attachments and Certificates of Analysis with an authorised laboratory representative.

**Corrective action:** Do not resume normal laboratory operations until the mismatch has been assessed. If necessary, return to a preserved pre-restore state or restore a verified matching backup set. Record any unavoidable data loss and obtain client acceptance before reopening production.

## 6.9 Escalation and Incident Records

If the problem cannot be resolved safely, stop potentially destructive actions and escalate to the responsible infrastructure administrator, hosting provider or Bika LIMS technical team according to Chapter 5.

Record the incident time, affected server, error messages, commands executed, backup identifiers, current service state, responsible personnel and the outcome. For production recovery, retain the client's authorisation and the results of post-recovery verification.

# 7. References and Additional Documentation

This chapter identifies the official technical resources and installation-specific records used to configure, maintain and recover Bika LIMS production backups. Administrators should consult the documentation for the **versions actually installed** on the target server, rather than assuming that examples from newer releases apply unchanged.

## 7.1 Official Technical References

| Component | Purpose | Reference |
|---|---|---|
| `collective.recipe.backup` | ZODB and BlobStorage backup, archive creation and restoration | [GitHub repository](https://github.com/collective/collective.recipe.backup) |
| `z3c.recipe.usercrontab` | Buildout-managed scheduled jobs | [PyPI](https://pypi.org/project/z3c.recipe.usercrontab/) and [source repository](https://github.com/buildout/z3c.recipe.usercrontab) |
| `zc.zrs` | Optional ZODB replication | [PyPI](https://pypi.org/project/zc.zrs/) |
| ZODB | Object database architecture and storage concepts | [ZODB documentation](https://zodb.org/) |
| ZEO | Shared ZODB storage service used by application clients | [ZEO on PyPI](https://pypi.org/project/ZEO/) |
| Plone | Application platform and version-specific deployment guidance | [Plone documentation](https://6.docs.plone.org/) - select guidance appropriate to the deployed Plone version |
| Supervisor | Process management on deployments using Supervisor | [Supervisor documentation](https://supervisord.org/) |
| OpenZFS | Filesystem and storage administration, where ZFS is deployed | [OpenZFS documentation](https://openzfs.github.io/openzfs-docs/) |

These references are starting points. Compatibility, available commands and configuration options must be checked against the deployed versions before changes are made to production.

## 7.2 Installation-Specific Documentation

Each production installation should maintain a restricted, up-to-date record containing:

- The production server identifier, operating system and responsible administrator.
- The Bika LIMS, Plone, Python, ZODB, ZEO and backup recipe versions.
- The active buildout configuration and installed add-ons.
- The configured `Data.fs` and BlobStorage paths.
- The local and remote backup destinations.
- The archive schedule, ZODB packing schedule and retention policy.
- The service manager and exact ZEO/client start and stop commands.
- The monitoring method, alert recipients and escalation contacts.
- The approved recovery procedure and most recent successful restoration test.
- The agreed Recovery Point Objective (RPO) and Recovery Time Objective (RTO).

Do not include passwords, private SSH keys, access tokens or other credentials in this document. Store sensitive operational details in an approved restricted-access system.

## 7.3 Backup and Recovery Records

For auditability and future recovery work, maintain records of:

1. **Backup execution:** date, recovery-point identifier, database archive, BlobStorage archive and success or failure status.
2. **Remote transfer:** destination, transfer completion, integrity verification and any reported errors.
3. **Restoration testing:** test date, selected recovery point, environment, results, issues and responsible administrator.
4. **Production recovery:** incident reference, client approval, restoration steps, downtime, data-loss assessment and laboratory acceptance.
5. **Configuration changes:** modifications to backup jobs, retention, storage, replication or recovery procedures.

## 7.4 Document Review and Maintenance

Review this procedure whenever the production architecture, backup software, storage layout, hosting arrangement or assigned responsibilities change. At a minimum, review it alongside periodic restoration tests.

Before using these procedures on a production installation, confirm the following against a representative production or staging instance:

- The `collective.recipe.backup` version and exact archive directory names.
- The installed `bin/backup`, `bin/zipbackup`, `bin/restore` and `bin/ziprestore` commands and their supported arguments.
- Whether ZODB and BlobStorage archives are produced and restored as a consistent pair.
- The actual `z3c.recipe.usercrontab` configuration and ZEO packing command.
- The service shutdown and startup order for each supported deployment type.
- Remote transfer verification and retention arrangements.
- A successful test restoration with application-level verification.

**Document status:** Repository-ready reference guide. Backup commands, paths, service names and restore procedures require deployment-specific validation and approval before production use. This document does not authorise an untested restoration on a live production server.
