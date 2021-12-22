// npx hardhat run --network localhost scripts/00_checkDeployment.ts

import { deployments, getNamedAccounts, ethers } from "hardhat";
import { CONTRACTS } from "./constants";
import {
    OlympusERC20Token__factory,
    OhmFaucet__factory,
    OlympusTreasury__factory,
    DAI__factory,
} from "../types";
import { waitFor } from "./txHelper";

async function main() {
    const faucetContract = "OhmFaucet";
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);
    console.log("Using Account:", deployer);

    // Get the deployed contracts
    const ohmDeployment = await deployments.get(CONTRACTS.ohm);
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const faucetDeployment = await deployments.get(faucetContract);

    // Connect to the contracts
    const ohm = OlympusERC20Token__factory.connect(ohmDeployment.address, signer);
    const treasury = OlympusTreasury__factory.connect(treasuryDeployment.address, signer);
    const faucet = OhmFaucet__factory.connect(faucetDeployment.address, signer);

    // Treasury base supply:
    let treasuryBaseSupply = await treasury.baseSupply();
    console.log("Treasury base supply:", treasuryBaseSupply.toString());

    // Print faucet balance:
    let faucetBalance = await ohm.balanceOf(faucetDeployment.address);
    console.log("Faucet balance:", faucetBalance.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
