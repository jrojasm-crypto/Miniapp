# Celo Smart Contract Notes

This miniapp is prepared for a Celo smart contract flow, but it does not yet send transactions.

## Network

- Mainnet chain ID: `42220` (`0xa4ec`)
- Testnet chain ID: `11142220` (`0xaa044c`)
- Recommended first deployment: Celo Sepolia
- Public Sepolia RPC: `https://forno.celo-sepolia.celo-testnet.org`
- Sepolia explorer: `https://celo-sepolia.blockscout.com`

## Contract Model

The contract in `contracts/RentalAgreementRegistry.sol` stores only:

- `contractHash`
- `propertyHash`
- `resident`
- `landlord`
- signature status and timestamps

Do not store full documents, IDs, or signature images on-chain. Hash them off-chain and anchor the hashes in the contract.

## Frontend Integration Plan

1. Deploy `RentalAgreementRegistry.sol` to Celo Sepolia.
2. Configure the deployed address in `app.js` as `celoConfig.contractAddress`.
3. Add Viem for contract writes.
4. Call `createAgreement(...)` after both parties are identified.
5. Let each party call `signAsResident(...)` or `signAsLandlord(...)` from their own wallet.

## Celo/MiniPay Notes

- Use Viem for Celo transactions because it supports `feeCurrency`.
- For MiniPay, use legacy transactions and `feeCurrency`; do not set EIP-1559 fee fields.
- User-facing copy should say `network fee`, not gas fee.
- For stablecoin fee abstraction, USDm uses `0x765DE816845861e75A25fCA122bb6898B8B1282a`.
- Do not invent deployed contract addresses. Configure the address only after deployment.
