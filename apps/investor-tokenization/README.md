# Investor Tokenization App

A Next.js application for investors to view and manage their tokenized investments on the Stellar network.

## Features

- **Investment Portfolio**: View all your token investments in one place
- **Token Balance Display**: See your token balances with proper formatting (similar to Stellar Expert)
- **Project Overview**: Browse available investment projects
- **Real-time Updates**: Token balances update automatically
- **Wallet Integration**: Connect with Stellar wallets (Freighter, Albedo)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Stellar wallet (Freighter or Albedo) for testnet

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## Architecture

### Key Features

- **Token Balance Reading**: Reads balances directly from Soroban contract storage
- **Investment Tracking**: Tracks user investments across multiple projects
- **Token Metadata**: Fetches and displays token names, symbols, and decimals
- **Stellar Expert Integration**: Links to view tokens on Stellar Expert

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── token-balance/      # Token balance reading API
│   │   └── token-metadata/     # Token metadata API
│   ├── investments/            # Investments page
│   └── page.tsx                # Home page
├── features/
│   ├── investments/            # Investment feature
│   │   ├── components/         # Investment UI components
│   │   ├── hooks/              # React hooks for data fetching
│   │   └── services/           # API service layer
│   └── transparency/           # Project transparency feature
└── components/
    └── tw-blocks/              # Shared UI components
```

## Documentation

- **[Token Balance System](./TOKEN_BALANCE_SYSTEM.md)** - Detailed documentation on how token balance reading works

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Stellar Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)

## Deploy on Vercel

The easiest way to deploy is using [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
