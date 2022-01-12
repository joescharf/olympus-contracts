// npx hardhat run --network localhost scripts/02_stakeOHM.ts

import { deployments, getNamedAccounts, ethers } from "hardhat";
import { CONTRACTS, INITIAL_MINT } from "./constants";
import {
    OlympusERC20Token__factory,
    OhmFaucet__factory,
    OlympusTreasury__factory,
    DAI__factory,
    OlympusStaking__factory,
    OlympusERC20Token,
    OlympusTreasury,
} from "../types";
import { waitFor } from "./txHelper";
import { txnButtonText } from "../../olympus-frontend/src/slices/PendingTxnsSlice";
import { jsonRPC, epoch, olympusStats } from "./joeUtil";

async function main() {
    const faucetContract = "OhmFaucet";
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);
    console.log("Deployer Account:", deployer);

    // Get the deployed contracts
    const ohmDeployment = await deployments.get(CONTRACTS.ohm);
    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const stakingDeployment = await deployments.get(CONTRACTS.staking);
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const faucetDeployment = await deployments.get(faucetContract);

    // Connect to the contracts
    const ohm = OlympusERC20Token__factory.connect(ohmDeployment.address, signer);
    const mockDai = DAI__factory.connect(daiDeployment.address, signer);
    const staking = OlympusStaking__factory.connect(stakingDeployment.address, signer);
    const treasury = OlympusTreasury__factory.connect(treasuryDeployment.address, signer);
    const faucet = OhmFaucet__factory.connect(faucetDeployment.address, signer);

    // SET SOME CONSTANTS
    // get number of OHM decimals for formatting purposes
    const ohmDecimals = await ohm.decimals();
    const daiDecimals = await mockDai.decimals();

    // JSON-RPC Provider Stats:
    await jsonRPC();
    // Epoch stats
    await epoch(staking);

    // First call the staking view functions to see where we stand:
    console.log("\n---- STAKING VIEW FUNCTIONS ----");
    const sOHMIndex = await staking.index();
    console.log("sOHMIndex:", ethers.utils.commify(sOHMIndex.toString()));
    let sOHMSupplyInWarmup = await staking.supplyInWarmup();
    console.log(
        "sOHMSupplyInWarmup:",
        ethers.utils.commify(ethers.utils.formatUnits(sOHMSupplyInWarmup, ohmDecimals)),
        "OHM"
    );

    console.log("\n---- BALANCES ----");
    // How much OHM does Deployer have?
    let deployerBalance = await ohm.balanceOf(deployer);
    console.log(
        "Deployer balance:",
        ethers.utils.commify(ethers.utils.formatUnits(deployerBalance, ohmDecimals)),
        "OHM"
    );

    // --------- TREASURY RESERVE FUNDING ---------
    console.log("\n---- TREASURY ----");
    await olympusStats(treasury, ohm);

    deployerBalance = await ohm.balanceOf(deployer);
    console.log(
        "0. Deployer OHM balance before DAI deposit:",
        ethers.utils.commify(ethers.utils.formatUnits(deployerBalance, ohmDecimals)),
        "OHM"
    );

    // Mint Dai
    const daiAmount = INITIAL_MINT;
    await waitFor(mockDai.mint(deployer, daiAmount));
    const daiBalance = await mockDai.balanceOf(deployer);
    console.log(
        "1. Minting DAI for Treasury: ",
        ethers.utils.formatUnits(daiBalance, daiDecimals),
        "DAI"
    );

    // Let's deposit DAI reserve tokens into treasury
    // 1. we need to enable the deployer to deposit (STATUS[0] = RESERVEDEPOSITOR)
    // 2. we need to enable DAI as reserve token (STATUS[2] = RESERVETOKEN)

    console.log("2. Enabling DAI as reserve token");
    await waitFor(treasury.enable(0, deployer, ethers.constants.AddressZero)); // Enable the deployer to deposit reserve tokens
    await waitFor(treasury.enable(2, daiDeployment.address, ethers.constants.AddressZero)); // Enable Dai as a reserve Token

    // Deposit DAI into treasury
    console.log(
        "3. Deposit " + ethers.utils.formatUnits(daiAmount, daiDecimals) + " DAI into treasury"
    );
    await waitFor(mockDai.approve(treasury.address, daiAmount)); // Approve treasury to use the dai
    await waitFor(treasury.deposit(daiAmount, daiDeployment.address, 0)); // Deposit Dai into treasury

    deployerBalance = await ohm.balanceOf(deployer);
    console.log(
        "4. Deployer OHM balance after DAI deposit:",
        ethers.utils.commify(ethers.utils.formatUnits(deployerBalance, ohmDecimals)),
        "OHM"
    );
    await olympusStats(treasury, ohm);

    // ----------- STAKE OHM -----------

    console.log("\n---- STAKING ----");
    // Stake - transfer from Deployer address to staking address
    const amount = 1000000000;
    const rebasing = true;
    const claim = false;
    // const tx = await ohm.transferFrom(deployer, stakingDeployment.address, amount);
    // console.log("transferFrom tx:", tx);

    // Stake the ohm
    // Treasury: insufficient reserves
    // First we have to approve the amount because stake does a safeTransferFrom
    console.log("ohm.approve");
    await ohm.approve(staking.address, amount);

    // staking.stake -> stake.rebase()
    // stake.rebase() -> distributor.distribute()
    // distributor.distribute() -> treasury.mint()
    // treasury.mint() -> treasury.withdraw()
    // treasury.withdraw() -> insufficient reserves
    console.log("staking.stake");
    await staking.stake(deployer, amount, rebasing, claim);

    sOHMSupplyInWarmup = await staking.supplyInWarmup();
    console.log(
        "New sOHMSupplyInWarmup:",
        ethers.utils.commify(ethers.utils.formatUnits(sOHMSupplyInWarmup, ohmDecimals)),
        "OHM"
    );

    // JSON-RPC Provider Stats:
    await jsonRPC();
    // Epoch stats
    await epoch(staking);
    await olympusStats(treasury, ohm);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
