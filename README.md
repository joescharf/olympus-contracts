# Ω Olympus V2 Smart Contract Analysis

## Overview
One of the best ways to come up to speed on solidity, smart contracts, DeFi, and Olympus V2 is to dive into the code. The following posts are my notes as I've been digging into the Olympus V2 contracts to better understand how it all works.

This repository contains some scripts I've developed to investigate the v2 contracts along with some changes and additions to support deploying to the IOTA EVM testnet.

This repository is forked from the [Olympus Contracts Repository](https://github.com/OlympusDAO/olympus-contracts.git) and references the `v2.0` tag (commit `3bb3605`)
## Links
- [Part 1: Setup](ANALYSIS/olympus_v2_smart_contract_analysis_part_1_setup.md)

# Quickstart
## Clone the analysis repository (this repo)
1. Clone the repository: `git clone https://github.com/joescharf/olympus-contracts.git olympus-v2-analysis`
2. `cd olympus-v2-analysis`
4. `yarn install`
5. create a `.env` file

```
MNEMONIC="twelve secret words designating your wallet accounts ..."
ALCHEMY_API_KEY="your_alchemy_api_key"
IOTA_PRIVATE_KEY="your_iota_evm_testnet_private_key"
```

## Deploy the contracts:
- `npx hardhat node --network hardhat` to start local json-rpc server and deploys all the contracts.
  - Run it in separate terminal process 
  - Uses the overloaded `hardhat node` provided by `hardhat-deploy` plugin [see hardhat node for more info](https://github.com/wighawag/hardhat-deploy/tree/master#2-hardhat-node)

## Run some checks:
- Run the test suite: `npx hardhat test` (uses harhat network. Note: tests fail if use localhost)
- Check the deployment with a script`npx hardhat run --network localhost scripts/00_checkDeployment.ts`
