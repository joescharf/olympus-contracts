# Olympus V2 Staking

there are two avenues to "investing" in Olympus. Staking and Bonding. This post will investigate staking

## Setup
- Deploy the contracts per [Part 1](olympus_v2_smart_contract_analysis_part_1_deployment_scripts.md)
- Dispense some OHM from the Testnet Faucet `npx hardhat run --network localhost scripts/01_dispenseOHM.ts`

## Notes
- Staking works if we don't trigger the rebase() functionality. This is basically the situation the unit tests setup for staking contract. 
- Getting the insufficient reserves probably b/c rebasing is happening. this is why the test test script sets rebasing way ahead of current block so rebasing doesn't happening. Will add this to the stakeOHM so we can stake without a rebase for now.


## Staking init
`100_post_deployments.ts` sets the staking contract as a distributor recipient with 0.4% reward:
- distributor.setBounty(100000000) 100 OHM?
- distributor.addRecipient(0xd0141e899a65c95a556fe2b27e5982a6de7fdd7a, 4000) // staking contract address, 4000 reward rate = 0.4% )


## Insufficient reserves error:

call trace w/ insufficient reserves error:
staking.stake -> stake.rebase()
stake.rebase() -> distributor.distribute()
distributor.distribute() -> treasury.mint()
treasury.mint() -> treasury.withdraw()
treasury.withdraw() -> insufficient reserves

Issues that might be causing this:
1. Treasury doesn't have enough ohm to mint for distributor recipient
2. Need to check our initial epoch settings - seems these are always set such that a rebase happens from the get-go.

## Staking Flow:

### Staking Interpretation Summary
- Staking.stake() (safe)transfers the amount the caller wants to stake and then calls the rebase function to determine if the asset balances need to be adjusted based on treasury holdings (this is the idea behind OHM as a reserve currency)
- staking.rebase() only happens if the current epoch has ended, meaning the current block timestamp has passed the designated epoch ending time.
- distributor.distribute() distributes rewards to recipients added to thenthe distributor info[] array.

### Staking Interpretation Verbose
  - The bulk of the rebase operations happen in sOHM.rebase(profit, epoch) `sOlympusERC20.sol` 
    - rebaseAmount, circulatingSupply vars
      circulatingSupply = totalSupply - balance(stakingContract) + gOHM.balanceFrom.totalSupply + staking.supplyInWarmup (TODO: may need to check this)
    - totalSupply constant is inherited from IERC20
    - If profit parameter passed in to rebase is 0, then we emit some logging information and return totalSupply of the sOHM contract
    - If there is no circulatingSupply, then rebaseAmount = profit parameter
    - Otherwise rebase amount = profit * totalSupply / circulatingSupply
    - increase totalSupply of sOHM up to MAX_SUPPLY constant
    - Emit event w/ data about rebase and return totalSupply
  - adjust the epoch end
- Distribution
  - distribute if a distributor contract exists: distribute.distribute() `StakingDistributor.sol`
    - Info[] public info { rate, recipient }
    - rateDenominator = 1,000,000 constant
    - for each recipient in Info array:
      - mint from the treasury to info.recipient, amount: ohm.totalSupply * rate / rateDenominator (1,000,000)
      - adjust the recipient reward rate
  - distributor.retrieveBounty() 
    - if distributor bounty > 0, then mint bounty from treasury for staking contract
  - balance of the staking contract = OHM.balance(this)
  - staked = sOHM.circulatingSupply
  - if balance < staked + bounty then epoch.distribute = 0, nothing to distribute this epoch
  - else epoch.distribute = balance - staked - bounty

### Staking Code (expanded)

```ts
// Call Staking.stake()
stake(to, amount, rebasing, claim)
// SafeTransferFrom  ohm amount from msg.sender to staking contract
ohm.safeTransferFrom(sender, this, _amount)
// Adjust the total amount based on rebase() bounty amount returned
amount = amount.add(rebase())
  // if the current block timestamp has passed our specified epoch ending timestamp, we rebase
  if epoch.end < block.timestamp
    
    // call the sOHM.rebase() function. Only the staking contract can call this function
    sOHM.rebase(epoch.distribute = profit_, epoch.number = epoch_)
      // if we don't have anything to distribute i.e. profit_, we just return the totalSupply of sOHM
      if profit_ == 0
        return _totalSupply
      // but if we have profit and circulatingSupply > 0, rebaseAmount = profit*(totalsupply/circulatingSupply)
      else if circulatingSupply > 0
        rebaseAmount = profit_ * (_totalSupply / circulatingSupply)
      // otherwise rebaseAmount = profit_
      else
        rebaseAmount = profit_
      // increase totalSupply:
      _totalSupply = _totalSupply + rebaseAmount
      // but not beyond MAX_SUPPLY
      if (_totalSupply > MAX_SUPPLY) {
          _totalSupply = MAX_SUPPLY;
      }
      // not sure what the gons are all about just yet...
      _gonsPerFragment = TOTAL_GONS/_totalSupply

      // Emits an event with data about rebase:
      _storeRebase(circulatingSupply_, profit_, epoch_);

      return _totalSupply;
    // END sOHM.rebase(...)

    // Update the epoch end & number of epochs:
    epoch.end = epoch.end.add(epoch.length);
    epoch.number++;

    // if we have a distributor contract, call its distribute() function, and retrieve bounty
    if (address(distributor) != address(0)) {
  
      // call distributor.distribute() can only be called by staking contract
      distributor.distribute()
        for (uint256 i = 0; i < info.length; i++) {
          if (info[i].rate > 0) {
              treasury.mint(info[i].recipient, nextRewardAt(info[i].rate)); // mint and send tokens
              adjust(i); // check for adjustment
          }
        }
      bounty = distributor.retrieveBounty()

    // determine epoch.distribute value based on 
    uint256 balance = OHM.balanceOf(address(this));
        uint256 staked = sOHM.circulatingSupply();
        if (balance <= staked.add(bounty)) {
            epoch.distribute = 0;
        } else {
            epoch.distribute = balance.sub(staked).sub(bounty);
        }
    }
    return bounty;

  // 3. claim is false so we skip the if and go to else
  if (_claim && warmupPeriod == 0) {
      return _send(_to, _amount, _rebasing);
  } else {

// 4. init a Claim mapped var in memory
Claim memory info = warmupInfo[_to];

  struct Claim {
      uint256 deposit; // if forfeiting
      uint256 gons; // staked balance
      uint256 expiry; // end of warmup period
      bool lock; // prevents malicious delays for claim
  }

so this sets info to warmupInfo[_to] // to address

and initializes the struct:
  warmupInfo[_to] = Claim({
      deposit: info.deposit.add(_amount),
      gons: info.gons.add(sOHM.gonsForBalance(_amount)),
      expiry: epoch.number.add(warmupPeriod),
      lock: info.lock
  });

```


RUN 1:

---- JSON-RPC Provider Stats ----
Current Block Number: 13,869,876
Current Block Timestamp: 1,640,376,229
---- EPOCH ----
Epoch len: 1,000 seconds
Epoch num: 767 since inception
Epoch end: 1,640,377,229 seconds
Epoch rem: 1,000 seconds

    IN STAKING
    epoch.end 1640377289
    block.timestamp 1640376289


RUN 2

---- JSON-RPC Provider Stats ----
Current Block Number: 13,869,883
Current Block Timestamp: 1,640,376,289
---- EPOCH ----
Epoch len: 1,000 seconds
Epoch num: 767 since inception
Epoch end: 1,640,377,289 seconds
Epoch rem: 1,000 seconds

    IN STAKING
    epoch.end 1640377507
    block.timestamp 1640376507




