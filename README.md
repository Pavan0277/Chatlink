# ChatLink

Decentralized chat app using Next.js, Hardhat, Solidity, Ethers.js, and MetaMask.

## What Works

- Wallet connect via MetaMask
- On-chain account creation
- Add friend by wallet address
- End-to-end encrypted messages using per-user public/private key pairs
- Send and read encrypted messages stored on-chain

## Prerequisites

- Node.js 18+
- MetaMask browser extension

## Run Locally (Windows PowerShell)

1. Install dependencies.

```powershell
npm install
```

2. Start local blockchain (keep this terminal open).

```powershell
npm run chain
```

3. In a new terminal, deploy the contract.

```powershell
npm run deploy:local
```

Copy the deployed address printed in terminal.

4. Create [`.env.local`](.env.local) in the project root.

```env
NEXT_PUBLIC_CHATAPP_ADDRESS=PASTE_DEPLOYED_ADDRESS_HERE
```

5. In another terminal, start web app.

```powershell
npm run dev
```

Open http://localhost:3000

6. Add Hardhat account in MetaMask.

- Import one private key from the local Hardhat node output.
- Network settings:
	- Network Name: Hardhat Local
	- RPC URL: http://127.0.0.1:8545
	- Chain ID: 31337
	- Currency Symbol: ETH

## Usage Flow

1. Connect wallet.
2. Create account username (app generates a local private key and stores your public key on-chain).
3. Add another registered wallet as friend.
4. Select friend and send messages.

## Scripts

- `npm run chain` starts Hardhat local chain
- `npm run compile` compiles contracts
- `npm run test` runs Hardhat tests
- `npm run deploy:local` deploys contract to local chain
- `npm run dev` starts Next.js app

## Notes

- The contract address is read from `NEXT_PUBLIC_CHATAPP_ADDRESS`.
- Without `.env.local`, the UI will show a contract configuration error.

## License

MIT. See [LICENSE](LICENSE).
