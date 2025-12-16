# Tokenization Lego on Stellar + Trustless Work

This repository is an **open-source template** showing how to build a full tokenization stack using:

- **Stellar / Soroban**
- **Trustless Work smart escrows**
- **Participation tokens**
- **Token sale contracts**
- **Vault contracts for ROI**
- **Next.js applications** for issuers, investors, and transparency

It’s meant for **learning, experimentation, and real product prototypes**.

---

## 📦 Monorepo Structure

```txt
apps/
  backoffice-tokenization        → Issuer console (escrows + tokenization flows)
  investor-tokenization          → Investor portal (buy + claim ROI)
  project-updates-tokenization   → Transparency portal (milestones + updates)
  evidence-service               → Off-chain evidence microservice
  smart-contracts                → Soroban contracts (escrow, token, sale, vault)
````

---

## 🚀 What This Template Demonstrates

### 1. **Escrow Workflow (Trustless Work)**

* Multi-release escrows
* Milestone updates & approvals
* Disputes & resolutions
* Release of funds
* Transparent role assignments

All implemented via **Trustless Work React Blocks** and Soroban contracts.

---

### 2. **Tokenization Engine**

A full lifecycle of a tokenized deal:

1. **Deploy token contract** (Token Factory)
2. **Create token sale** (primary issuance)
3. **Route funds into escrow**
4. **Execute milestones** via Trustless Work
5. **Send returns to vault**
6. **Investors claim ROI** based on token balance

This mirrors **private credit**, **real-estate**, **crowdfunding**, and other RWA flows.

---

### 3. **Three Example Frontends**

#### **Backoffice (Issuer)**

* Create & manage escrows
* Deploy token + token sale + vault
* Update milestones
* Resolve disputes
* Release funds

#### **Investor Portal**

* Join token sale
* Check holdings
* Claim ROI from the vault
* View transparency indicators

#### **Project Updates (Viewer)**

* View milestone progress
* See escrow transparency
* Understand project lifecycle

---

## 🧱 Smart Contracts Included

All in `apps/smart-contracts`:

* **Escrow contract**
  Multi-release escrow with roles, disputes, approvals, releases.

* **Token Factory**
  Mint/burn participation tokens.

* **Token Sale**
  Sell tokens in exchange for USDC and route funds into escrow.

* **Vault contract**
  Hold returns and enable ROI claims based on token holdings.

Each contract includes tests + JSON snapshots.

---

## 🛠️ Running the Apps

```bash
cd apps/<app-name>
npm install
npm run dev
```

Apps run independently (different ports).

---

## ⚙️ Environment Variables

Each app uses a `.env` file including:

```
NEXT_PUBLIC_SOROBAN_RPC_URL=
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID=
NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ID=
NEXT_PUBLIC_VAULT_CONTRACT_ID=
NEXT_PUBLIC_TRUSTLESS_WORK_API_URL=
NEXT_PUBLIC_TRUSTLESS_WORK_API_KEY=
```

Copy each example `.env`, adjust to your network/contracts.

---

## 🧪 Local Development Notes

* All apps use **Next.js (App Router)**
* Styled with **Tailwind + ShadCN**
* Wallet integration powered by Trustless Work Wallet Kit
* Smart contract calls through Soroban RPC helpers
* Escrow UI powered by Trustless Work Blocks

This makes the repo a **plug-and-play playground** for RWA tokenization development.

---

## 🌐 Intended Use

This template is designed for:

* Builders experimenting with tokenization
* Teams learning how escrows + tokens + ROI work together
* Hackathon projects
* Platforms exploring RWA architecture
* Developers integrating Trustless Work

Fork it, modify it, and build your own tokenization product.

---

## 📄 License

MIT — use freely for education, prototypes, and commercial projects.

---

```

---
