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

Each app has its own `.env.example` file with the required environment variables:

- **`apps/investor-tokenization/.env.example`** - For the investor tokenization app
- **`apps/backoffice-tokenization/.env.example`** - For the backoffice tokenization app
- **`apps/evidence-service/.env.example`** - For the evidence service (IPFS/Pinata)
- **`apps/project-updates-tokenization/.env.example`** - For the project updates app

To set up each app:

1. Copy the `.env.example` file to `.env.local` (or `.env`) in the app directory:
   ```bash
   cd apps/<app-name>
   cp .env.example .env.local
   ```

2. Fill in the required values in `.env.local`

**Common variables across apps:**
- `NEXT_PUBLIC_SOROBAN_RPC_URL` - Soroban RPC endpoint
- `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` - Stellar network passphrase
- `NEXT_PUBLIC_ESCROW_CONTRACT_ID` - Deployed escrow contract address
- `NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID` - Token factory contract address
- `NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ID` - Token sale contract address
- `NEXT_PUBLIC_VAULT_CONTRACT_ID` - Vault contract address
- `NEXT_PUBLIC_API_KEY` - Trustless Work API key
- `NEXT_PUBLIC_TRUSTLESS_WORK_API_URL` - Trustless Work API URL

**App-specific variables:**
- **investor-tokenization**: `SOURCE_SECRET` (server-side, for contract deployment)
- **evidence-service**: `PINATA_API_KEY`, `PINATA_SECRET_KEY` (for IPFS uploads)

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
