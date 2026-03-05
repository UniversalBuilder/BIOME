# Code Signing — BIOME MSI

Without a valid Authenticode signature, **Windows Smart App Control (SAC)** blocks
installation silently on Windows 11 22H2+ machines. Unlike SmartScreen, SAC provides
no "Run anyway" bypass — the block is permanent until a certificate is obtained.

---

## Background: SAC vs SmartScreen

| Mechanism | Bypass available? | Trigger |
|---|---|---|
| SmartScreen | Yes ("More info → Run anyway") | Unknown publisher |
| **Smart App Control** | **No** | Unsigned binary on SAC-enabled machine |

SAC is enabled by default on fresh Windows 11 22H2+ installs and cannot be bypassed
without either a code-signing certificate or disabling SAC entirely (irreversible
without OS reinstall). The current build has `certificateThumbprint: null` in
`tauri.conf.json`, so every MSI produced is unsigned.

---

## Options (by cost)

### Option A — Azure Trusted Signing (~15 USD/month) ✅ Recommended

Microsoft's own signing service. Immediate SAC trust. No hardware token required.
Identity validation takes < 24 h.

1. Create an Azure account and enable **Trusted Signing**.
2. Complete the identity validation for your organisation.
3. Install the [Azure Trusted Signing client tools](https://learn.microsoft.com/azure/trusted-signing).
4. Sign the MSI post-build (see **Signing workflow** below).

Timestamp URL: `http://timestamp.acs.microsoft.com`

---

### Option B — OV Certificate (~80–300 USD/year)

Standard Organisation Validation certificate from DigiCert, Sectigo, SSL.com etc.
Installs as a PFX file. Tauri calls `signtool.exe` automatically during `tauri build`
when a thumbprint is provided.

1. Purchase and download the `.pfx` certificate.
2. Install it in the Windows Certificate Store (double-click → import, mark as exportable).
3. Note the SHA-1 thumbprint (visible in `certmgr.msc` → Details → Thumbprint).
4. Update `tauri.conf.json`:

```json
"bundle": {
  "windows": {
    "certificateThumbprint": "AABBCC1122...",
    "digestAlgorithm": "sha256",
    "timestampUrl": "http://timestamp.digicert.com"
  }
}
```

5. Run `npm run simple-msi` — Tauri will sign automatically.

---

### Option C — EV Certificate (~350–600 USD/year)

Extended Validation. Requires a USB hardware token. Provides immediate SmartScreen
reputation as well as SAC trust. Overkill for internal distribution.

---

## Signing workflow (post-build, all options)

If signing is done outside of Tauri (e.g. via Azure Trusted Signing CLI):

```powershell
# 1. Build unsigned MSI as usual
cd D:\DEV\BIOME\projet-analyse-image-frontend
npm run simple-msi

# 2. Sign the produced MSI
$msi = "src-tauri\target\release\bundle\msi\BIOME_2.5.0_x64_en-US.msi"

# Option A — Azure Trusted Signing
AzureSignTool sign `
  --azure-key-vault-url         "https://YOUR_VAULT.vault.azure.net" `
  --azure-key-vault-client-id   "$env:AZURE_CLIENT_ID" `
  --azure-key-vault-secret      "$env:AZURE_CLIENT_SECRET" `
  --azure-key-vault-tenant-id   "$env:AZURE_TENANT_ID" `
  --azure-key-vault-certificate "YOUR_CERT_NAME" `
  --timestamp-rfc3161            "http://timestamp.acs.microsoft.com" `
  $msi

# Option B — Local PFX via signtool
signtool sign /fd sha256 /tr http://timestamp.digicert.com /td sha256 `
  /sha1 "AABBCC1122..." `
  $msi

# 3. Recompute SHA256 after signing (signature changes the file)
$hash = (Get-FileHash $msi -Algorithm SHA256).Hash
$hash | Set-Content "D:\DEV\BIOME\BIOME-Distribution\BIOME_2.5.0_x64_en-US.msi.sha256" -Encoding UTF8

# 4. Copy signed MSI to distribution folder
Copy-Item $msi "D:\DEV\BIOME\BIOME-Distribution\"
```

> ⚠️ Always recompute SHA256 **after** signing — the signature bytes modify the file.

---

## Integrating signing in the Tauri build (Option B only)

When using a local PFX / thumbprint, Tauri calls `signtool.exe` automatically.
Set the thumbprint once in `tauri.conf.json` and every `tauri build` will sign:

```jsonc
// projet-analyse-image-frontend/src-tauri/tauri.conf.json
"bundle": {
  "windows": {
    "certificateThumbprint": "AABBCC1122334455...",  // SHA-1 of your cert
    "digestAlgorithm": "sha256",
    "timestampUrl": "http://timestamp.digicert.com"
  }
}
```

Do **not** commit the PFX file or any secrets to the repository.
Store secrets in environment variables or a secrets manager.

---

## Workarounds for users blocked today (no cert yet)

These are machine-level workarounds to share with affected users:

1. **Disable Smart App Control** (destructive, not recommended for end users)  
   Windows Security → App & browser control → Smart App Control → **Off**  
   ⚠️ Irreversible without a Windows reinstall.

2. **Install from a network share** (trusted zone)  
   Copy the MSI to a mapped network drive or UNC path (`\\server\share\`).
   Files from internal network shares do not receive a Mark of the Web and bypass SAC.

3. **Group Policy / WDAC rule** (domain-joined machines only)  
   An IT admin can create a Windows Defender Application Control policy allowing the
   specific MSI hash (`A94EBD3FBE85EFFCFCCDB4B539F244EEF9303F68B3FB03CD19AC1C896BE0CA16`).

---

## Current status

| Version | Signed | Certificate |
|---|---|---|
| ≤ 2.5.0 | ❌ No | `certificateThumbprint: null` |
| Next release | Pending | — |
