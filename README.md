# Ω Olympus V2 Smart Contract Analysis

## Overview
One of the best ways to come up to speed on solidity, smart contracts, DeFi, and Olympus V2 is to dive into the code. The following posts are my notes as I've been digging into the Olympus V2 contracts to better understand how it all works.

This repository contains some scripts I've developed to investigate the v2 contracts along with some changes and additions to support deploying to the IOTA EVM testnet.

This repository is forked from the [Olympus Contracts Repository](https://github.com/OlympusDAO/olympus-contracts.git) and references the `v2.0` tag (commit `3bb3605`)
# Table of Contents
- --> **README**
- [Deployment Scripts and Contracts](ANALYSIS/olympus_v2_smart_contract_analysis_part_1_deployment_scripts.md)
- [Testnet and OHM Faucet](ANALYSIS/olympus_v2_ohm_faucet.md)
- [Staking analysis](ANALYSIS/olympus_v2_staking.md)
# Quickstart
## Clone the analysis repository (this repo)
```zsh
# Clone the repo and install node modules
git clone https://github.com/joescharf/olympus-v2-analysis.git
cd olympus-v2-analysis
yarn install
```
Create `.env` file
```
MNEMONIC="twelve secret words designating your wallet accounts ..."
ALCHEMY_API_KEY="your_alchemy_api_key"
IOTA_PRIVATE_KEY="your_iota_evm_testnet_private_key"
```

## Deploy the contracts, run tests and checkDeployment script:
```zsh
# start local json-rpc server and deploy all the contracts.
# uses overloaded hardhat-node provided by hardhat-deploy plugin
npx hardhat node

## You'll probably get an error along the lines of:
## scripts/deploy/005_deploy_treasury.ts:5:42 - error TS2307: Cannot find module '../../types' or its corresponding type declarations.

## Fix: Just run the deployment again!
npx hardhat node

# Run test suite:
npx hardhat test

# Run checkDeployment script
npx hardhat run --network localhost scripts/00_checkDeployment.ts

## Dispense some OHM from the Faucet
npx hardhat run --network localhost scripts/01_dispenseOHM.ts
```

## Other Commands and Scripts

```zsh

# Deploy just the testnet
npx hardhat deploy --network localhost --tags testnet

# Test the iota evm by attempting to deploy just the OlympusAuthority
npx hardhat deploy --network iota --tags OlympusAuthority
```