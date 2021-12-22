// npx hardhat run --network localhost scripts/01_dispenseOHM.ts

import { deployments, getNamedAccounts, ethers } from "hardhat";
import { CONTRACTS } from "./constants";
import { OlympusERC20Token__factory, OhmFaucet__factory } from "../types";
import { waitFor } from "./txHelper";

async function main() {
    const faucetContract = "OhmFaucet";
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);
    console.log("Using Account:", deployer);

    // Get the deployed contracts
    const ohmDeployment = await deployments.get(CONTRACTS.ohm);
    const faucetDeployment = await deployments.get(faucetContract);

    // Connect to the contracts
    const ohm = OlympusERC20Token__factory.connect(ohmDeployment.address, signer);
    const faucet = OhmFaucet__factory.connect(faucetDeployment.address, signer);

    // Print faucet balance:
    let faucetBalance = await ohm.balanceOf(faucetDeployment.address);
    console.log("Faucet balance:", faucetBalance.toString());

    console.log("Dispensing 5 OHM:");
    for (let i = 0; i < 5; i++) {
        await waitFor(faucet.dispense());
    }

    const deployerBalance = await ohm.balanceOf(deployer);
    console.log("Deployer balance:", deployerBalance.toString());

    faucetBalance = await ohm.balanceOf(faucetDeployment.address);
    console.log("New Faucet balance:", faucetBalance.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
