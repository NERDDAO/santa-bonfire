# 🎄 Santa Bonfire - AI-Generated Christmas Cards

<h4 align="center">
  Create magical, AI-generated Christmas cards from Santa's knowledge graph
</h4>

🎅 Santa Bonfire transforms knowledge graphs into personalized, AI-generated Christmas cards with blockchain-verified payments. Built on Scaffold-ETH 2 and powered by the x402 protocol.

⚙️ Built using NextJS, RainbowKit, Foundry/Hardhat, Wagmi, Viem, and Typescript.

- 🎁 **AI-Powered Card Creation**: Advanced AI generates unique Christmas cards from Santa's bonfires using hierarchical task networks.
- 💳 **Payment-Gated Access**: Secure x402 protocol payments with blockchain verification.
- ❄️ **Instant Magic**: Card generation happens in the background (30-60 seconds) with real-time progress tracking.
- 🌟 **Share the Joy**: Create public cards to spread holiday cheer or keep them private.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

1. Clone the repository and install dependencies:

```bash
cd demos/santa-bonfire
yarn install
```

2. Set up environment variables:

```bash
cp packages/nextjs/.env.example packages/nextjs/.env.local
# Edit .env.local with your API keys and configuration
```

3. Start the NextJS app:

```bash
yarn start
```

Visit your app on: `http://localhost:3000`

## Features

### 🎄 Browse Bonfires
Explore magical bonfires containing curated knowledge about Christmas, traditions, and holiday cheer. Each bonfire offers unique themes for your Christmas cards.

### 💰 Connect & Create
Connect your wallet and make secure payments using the x402 protocol. All transactions are verified on-chain for transparent and trustless access.

### ✨ Magic Happens
Our AI system uses Hierarchical Task Networks to traverse Santa's knowledge graph and generate heartfelt, personalized Christmas cards in 30-60 seconds.

### 🎁 Share Joy
Once your card is ready, share it with friends and family. Make it public to spread holiday cheer or keep it as a special private message.

## Technology Stack

- **HTN Generation**: Hierarchical Task Networks for structured card content
- **Knowledge Graphs**: Graphiti-powered graph traversal
- **x402 Protocol**: Blockchain payment verification
- **RainbowKit + wagmi**: Seamless wallet connection

## Contributing

We welcome contributions to Santa Bonfire! Please see the contributing guidelines for more information.

---

Built with ❤️ and holiday spirit 🎄

