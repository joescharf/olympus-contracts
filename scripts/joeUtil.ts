import { ethers } from "hardhat";
import { OlympusERC20Token, OlympusTreasury } from "../types";

export function unixToDateStr(unixTS: number): string {
    const dtFormat = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "MST",
    });
    const dateStr = dtFormat.format(new Date(unixTS));
    return dateStr;
}

export async function jsonRPC(): Promise<void> {
    console.log("\n---- JSON-RPC Provider Stats ----");
    // Get current block number
    const currentBlockNumber = await ethers.provider.send("eth_blockNumber", []);
    console.log(
        "Current Block Number:",
        ethers.utils.commify(ethers.BigNumber.from(currentBlockNumber).toString())
    );

    // Get current block by number
    const currentBlock = await ethers.provider.send("eth_getBlockByNumber", [
        currentBlockNumber,
        false,
    ]);
    // Output block timestamp
    console.log(
        "Current Block Timestamp: %s (%s)",
        ethers.utils.commify(ethers.BigNumber.from(currentBlock.timestamp).toString()),
        unixToDateStr(+currentBlock.timestamp * 1000)
    );
}

export async function epoch(staking: any): Promise<void> {
    console.log("---- EPOCH ----");
    const epoch = await staking.epoch();
    const currentBlock = await ethers.provider.send("eth_getBlockByNumber", ["latest", false]);
    console.log("Epoch len:", ethers.utils.commify(epoch[0].toString()), "seconds"); // because epoch.length returns length of the array!
    console.log("Epoch num:", ethers.utils.commify(epoch.number.toString()), "since inception");
    console.log(
        "Epoch end: %s seconds (%s)",
        ethers.utils.commify(epoch.end.toString()),
        unixToDateStr(+epoch.end * 1000)
    );
    console.log(
        "Epoch rem:",
        ethers.utils.commify(epoch.end.sub(currentBlock.timestamp).toString()),
        "seconds"
    );
}

export async function olympusStats(
    treasury: OlympusTreasury,
    ohm: OlympusERC20Token
): Promise<void> {
    // get number of OHM decimals for formatting purposes
    const ohmDecimals = await ohm.decimals();

    console.log("\nTreasury Stats:");
    console.log(
        "  Treasury Base Supply:",
        ethers.utils.commify(ethers.utils.formatUnits(await treasury.baseSupply(), ohmDecimals)),
        "OHM"
    );
    console.log(
        "  Treasury Total Reserves:",
        ethers.utils.commify(ethers.utils.formatUnits(await treasury.totalReserves(), ohmDecimals)),
        "OHM"
    );
    console.log(
        "  Treasury EXCESS Reserves:",
        ethers.utils.commify(
            ethers.utils.formatUnits(await treasury.excessReserves(), ohmDecimals)
        ),
        "OHM"
    );
    console.log(
        "  Treasury Total Debt:",
        ethers.utils.commify(ethers.utils.formatUnits(await treasury.totalDebt(), ohmDecimals)),
        "OHM"
    );
    console.log(
        "  Treasury OHM Debt:",
        ethers.utils.commify(ethers.utils.formatUnits(await treasury.ohmDebt(), ohmDecimals)),
        "OHM"
    );
    console.log(
        "  Treasury OHM Balance:",
        ethers.utils.commify(
            ethers.utils.formatUnits(await ohm.balanceOf(treasury.address), ohmDecimals)
        ),
        "OHM"
    );
    console.log("OHM Stats:");
    console.log(
        "  OHM Total Supply:",
        ethers.utils.commify(ethers.utils.formatUnits(await ohm.totalSupply(), ohmDecimals)),
        "OHM\n"
    );
}
