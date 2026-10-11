const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const E = (n) => ethers.parseEther(String(n));
const PRICE_AGI = E(500);
const PRICE_ETH = E("0.01");
const MIN_HOLD = E(500);
const IMAGE_BASE = "https://agieggs.vercel.app/api/egg-image/";

async function deploy(opts = {}) {
  const {
    maxSupply = 5000,
    designCount = 108,
    priceAGI = PRICE_AGI,
    priceETH = PRICE_ETH,
    minHold = MIN_HOLD,
  } = opts;
  const [deployer, alice, bob, carol, orchestrator, provider, pair, stranger] =
    await ethers.getSigners();

  // Treasury needs the token address and the token needs the treasury:
  // predict the token's address from the deployer nonce.
  const nonce = await deployer.getNonce();
  const agiAddr = ethers.getCreateAddress({ from: deployer.address, nonce: nonce + 1 });

  const treasury = await (await ethers.getContractFactory("ComputeTreasury")).deploy(
    agiAddr,
    orchestrator.address,
  );
  const agi = await (await ethers.getContractFactory("AGIToken")).deploy(
    deployer.address,
    await treasury.getAddress(),
  );
  expect(await agi.getAddress()).to.equal(agiAddr);

  const egg = await (await ethers.getContractFactory("AGIEgg")).deploy(
    agiAddr,
    await treasury.getAddress(),
    maxSupply,
    designCount,
    priceAGI,
    priceETH,
    minHold,
    IMAGE_BASE,
  );
  await agi.setReceiverHook(await egg.getAddress(), true);

  for (const s of [alice, bob, carol]) await agi.transfer(s.address, E(100_000));

  return { agi, egg, treasury, deployer, alice, bob, carol, orchestrator, provider, pair, stranger };
}

const decodeURI = (uri) =>
  JSON.parse(Buffer.from(uri.replace("data:application/json;base64,", ""), "base64").toString());

// ---------------------------------------------------------------------------
describe("AGIToken", () => {
  it("mints the fixed 100M supply once and exposes no mint function", async () => {
    const { agi, deployer } = await deploy();
    expect(await agi.totalSupply()).to.equal(E(100_000_000));
    expect(await agi.MAX_SUPPLY()).to.equal(E(100_000_000));
    expect(agi.interface.getFunction("mint")).to.equal(null);
    expect(await agi.balanceOf(deployer.address)).to.equal(E(100_000_000 - 300_000));
  });

  it("does not tax wallet-to-wallet transfers", async () => {
    const { agi, alice, bob } = await deploy();
    await agi.connect(alice).transfer(bob.address, E(1000));
    expect(await agi.balanceOf(bob.address)).to.equal(E(101_000));
  });

  it("taxes 2.5% on buys and sells through a registered pair", async () => {
    const { agi, treasury, alice, pair } = await deploy();
    const tAddr = await treasury.getAddress();
    await agi.setPair(pair.address, true);
    await agi.transfer(pair.address, E(10_000)); // owner is exempt

    await agi.connect(pair).transfer(alice.address, E(1000)); // buy
    expect(await agi.balanceOf(alice.address)).to.equal(E(100_975));
    expect(await agi.balanceOf(tAddr)).to.equal(E(25));

    await agi.connect(alice).transfer(pair.address, E(1000)); // sell
    expect(await agi.balanceOf(tAddr)).to.equal(E(50));
  });

  it("skips the tax for exempt accounts", async () => {
    const { agi, alice, pair } = await deploy();
    await agi.setPair(pair.address, true);
    await agi.setTaxExempt(alice.address, true);
    await agi.connect(alice).transfer(pair.address, E(1000));
    expect(await agi.balanceOf(pair.address)).to.equal(E(1000));
  });

  it("restricts admin functions to the owner", async () => {
    const { agi, alice } = await deploy();
    for (const call of [
      () => agi.connect(alice).setPair(alice.address, true),
      () => agi.connect(alice).setTaxExempt(alice.address, true),
      () => agi.connect(alice).setTreasury(alice.address),
      () => agi.connect(alice).setReceiverHook(alice.address, true),
    ]) {
      await expect(call()).to.be.revertedWithCustomError(agi, "OwnableUnauthorizedAccount");
    }
  });

  it("rejects zero addresses and EOA hooks", async () => {
    const { agi, alice } = await deploy();
    await expect(agi.setTreasury(ethers.ZeroAddress)).to.be.revertedWithCustomError(agi, "ZeroAddress");
    await expect(agi.setReceiverHook(alice.address, true)).to.be.revertedWithCustomError(agi, "NotAContract");
  });

  it("reverts the transfer when a hook returns the wrong value", async () => {
    const { agi, alice } = await deploy();
    const bad = await (await ethers.getContractFactory("BadHook")).deploy();
    await agi.setReceiverHook(await bad.getAddress(), true);
    await expect(agi.connect(alice).transfer(await bad.getAddress(), E(1))).to.be.revertedWithCustomError(
      agi,
      "HookRejected",
    );
    expect(await agi.balanceOf(await bad.getAddress())).to.equal(0);
  });

  it("can permanently lock the pair list", async () => {
    const { agi, alice, pair } = await deploy();
    await agi.setPair(pair.address, true);
    await expect(agi.lockPairs()).to.emit(agi, "PairsLocked");
    await expect(agi.setPair(alice.address, true)).to.be.revertedWithCustomError(agi, "PairsAreLocked");
    await expect(agi.setPair(pair.address, false)).to.be.revertedWithCustomError(agi, "PairsAreLocked");
    await expect(agi.connect(alice).lockPairs()).to.be.revertedWithCustomError(agi, "OwnableUnauthorizedAccount");
  });

  it("uses two-step ownership transfer", async () => {
    const { agi, deployer, alice } = await deploy();
    await agi.transferOwnership(alice.address);
    expect(await agi.owner()).to.equal(deployer.address);
    await agi.connect(alice).acceptOwnership();
    expect(await agi.owner()).to.equal(alice.address);
  });
});

// ---------------------------------------------------------------------------
describe("AGIEgg — connected minting", () => {
  it("mints the chosen design with AGI and pays the treasury", async () => {
    const { agi, egg, treasury, alice } = await deploy();
    await agi.connect(alice).approve(await egg.getAddress(), PRICE_AGI * 2n);
    await expect(egg.connect(alice).mintWithAGI(7, 2, PRICE_AGI * 2n))
      .to.emit(egg, "EggMinted")
      .withArgs(alice.address, 1, 7, 0);
    expect(await egg.balanceOf(alice.address)).to.equal(2);
    expect((await egg.eggOf(2)).design).to.equal(7);
    expect(await agi.balanceOf(await treasury.getAddress())).to.equal(PRICE_AGI * 2n);
  });

  it("protects the buyer with maxCost", async () => {
    const { agi, egg, alice } = await deploy();
    await agi.connect(alice).approve(await egg.getAddress(), ethers.MaxUint256);
    await egg.setPrices(PRICE_AGI * 3n, PRICE_ETH);
    await expect(egg.connect(alice).mintWithAGI(0, 1, PRICE_AGI)).to.be.revertedWithCustomError(
      egg,
      "CostAboveMax",
    );
  });

  it("validates design, quantity and allowance", async () => {
    const { agi, egg, alice } = await deploy();
    await expect(egg.connect(alice).mintWithAGI(108, 1, PRICE_AGI)).to.be.revertedWithCustomError(egg, "InvalidDesign");
    await expect(egg.connect(alice).mintWithAGI(0, 0, 0)).to.be.revertedWithCustomError(egg, "InvalidQuantity");
    await expect(egg.connect(alice).mintWithAGI(0, 11, PRICE_AGI * 11n)).to.be.revertedWithCustomError(
      egg,
      "InvalidQuantity",
    );
    await expect(egg.connect(alice).mintWithAGI(0, 1, PRICE_AGI)).to.be.revertedWithCustomError(
      agi,
      "ERC20InsufficientAllowance",
    );
  });

  it("mints with ETH and refunds overpayment", async () => {
    const { egg, treasury, alice } = await deploy();
    const tAddr = await treasury.getAddress();
    const before = await ethers.provider.getBalance(tAddr);
    await expect(egg.connect(alice).mintWithETH(3, 1, { value: PRICE_ETH * 3n }))
      .to.emit(egg, "Refunded")
      .withArgs(alice.address, PRICE_ETH * 2n, 1);
    expect(await ethers.provider.getBalance(tAddr)).to.equal(before + PRICE_ETH);
    expect(await ethers.provider.getBalance(await egg.getAddress())).to.equal(0);
    await expect(egg.connect(alice).mintWithETH(3, 1, { value: PRICE_ETH - 1n })).to.be.revertedWithCustomError(
      egg,
      "InsufficientPayment",
    );
  });

  it("can disable a payment method by setting its price to zero", async () => {
    const { agi, egg, alice } = await deploy();
    await egg.setPrices(0, 0);
    await expect(egg.connect(alice).mintWithETH(0, 1, { value: PRICE_ETH })).to.be.revertedWithCustomError(
      egg,
      "PaymentDisabled",
    );
    await expect(agi.connect(alice).transfer(await egg.getAddress(), PRICE_AGI)).to.be.revertedWithCustomError(
      egg,
      "PaymentDisabled",
    );
  });
});

// ---------------------------------------------------------------------------
describe("AGIEgg — send AGI directly (no site connection)", () => {
  it("mints one egg to the sender for exactly the price", async () => {
    const { agi, egg, treasury, alice } = await deploy();
    await agi.connect(alice).transfer(await egg.getAddress(), PRICE_AGI);
    expect(await egg.balanceOf(alice.address)).to.equal(1);
    expect(await agi.balanceOf(await treasury.getAddress())).to.equal(PRICE_AGI);
    expect(await agi.balanceOf(await egg.getAddress())).to.equal(0);
    expect((await egg.eggOf(1)).design).to.be.lessThan(108);
  });

  it("mints whole eggs and refunds the remainder", async () => {
    const { agi, egg, alice } = await deploy();
    const sent = PRICE_AGI * 3n + PRICE_AGI / 2n;
    await expect(agi.connect(alice).transfer(await egg.getAddress(), sent))
      .to.emit(egg, "Refunded")
      .withArgs(alice.address, PRICE_AGI / 2n, 0);
    expect(await egg.balanceOf(alice.address)).to.equal(3);
    expect(await agi.balanceOf(alice.address)).to.equal(E(100_000) - PRICE_AGI * 3n);
  });

  it("caps at 10 eggs per send and refunds the rest", async () => {
    const { agi, egg, alice } = await deploy();
    await agi.connect(alice).transfer(await egg.getAddress(), PRICE_AGI * 15n);
    expect(await egg.balanceOf(alice.address)).to.equal(10);
    expect(await agi.balanceOf(alice.address)).to.equal(E(100_000) - PRICE_AGI * 10n);
  });

  it("reverts (keeping the sender's AGI) when the amount is below the price", async () => {
    const { agi, egg, alice } = await deploy();
    await expect(agi.connect(alice).transfer(await egg.getAddress(), PRICE_AGI - 1n)).to.be.revertedWithCustomError(
      egg,
      "InsufficientPayment",
    );
    expect(await agi.balanceOf(alice.address)).to.equal(E(100_000));
  });

  it("reverts while paused", async () => {
    const { agi, egg, alice } = await deploy();
    await egg.pause();
    await expect(agi.connect(alice).transfer(await egg.getAddress(), PRICE_AGI)).to.be.revertedWithCustomError(
      egg,
      "EnforcedPause",
    );
  });

  it("reverts for senders that cannot hold NFTs, so their AGI is not lost", async () => {
    const { agi, egg, alice } = await deploy();
    const wallet = await (await ethers.getContractFactory("NonReceiverWallet")).deploy();
    await agi.connect(alice).transfer(await wallet.getAddress(), PRICE_AGI);
    await expect(wallet.sendAGI(await agi.getAddress(), await egg.getAddress(), PRICE_AGI)).to.be.revertedWithCustomError(
      egg,
      "ERC721InvalidReceiver",
    );
    expect(await agi.balanceOf(await wallet.getAddress())).to.equal(PRICE_AGI);
  });

  it("only accepts the callback from the AGI token", async () => {
    const { egg, stranger } = await deploy();
    await expect(egg.connect(stranger).onAGIReceived(stranger.address, PRICE_AGI)).to.be.revertedWithCustomError(
      egg,
      "OnlyAGI",
    );
  });

  it("mints to the token owner when an approved spender uses transferFrom", async () => {
    const { agi, egg, alice, bob } = await deploy();
    await agi.connect(alice).approve(bob.address, PRICE_AGI);
    await agi.connect(bob).transferFrom(alice.address, await egg.getAddress(), PRICE_AGI);
    expect(await egg.balanceOf(alice.address)).to.equal(1);
    expect(await egg.balanceOf(bob.address)).to.equal(0);
  });
});

// ---------------------------------------------------------------------------
describe("AGIEgg — send ETH directly (no site connection)", () => {
  it("mints to the sender, forwards ETH, refunds the remainder", async () => {
    const { egg, treasury, alice } = await deploy();
    const tAddr = await treasury.getAddress();
    const tBefore = await ethers.provider.getBalance(tAddr);
    const sent = PRICE_ETH * 2n + PRICE_ETH / 2n;
    await expect(alice.sendTransaction({ to: await egg.getAddress(), value: sent }))
      .to.emit(egg, "Refunded")
      .withArgs(alice.address, PRICE_ETH / 2n, 1);
    expect(await egg.balanceOf(alice.address)).to.equal(2);
    expect(await ethers.provider.getBalance(tAddr)).to.equal(tBefore + PRICE_ETH * 2n);
    expect(await ethers.provider.getBalance(await egg.getAddress())).to.equal(0);
  });

  it("reverts below the price and when ETH minting is disabled", async () => {
    const { egg, alice } = await deploy();
    const to = await egg.getAddress();
    await expect(alice.sendTransaction({ to, value: PRICE_ETH - 1n })).to.be.revertedWithCustomError(
      egg,
      "InsufficientPayment",
    );
    await egg.setPrices(PRICE_AGI, 0);
    await expect(alice.sendTransaction({ to, value: PRICE_ETH })).to.be.revertedWithCustomError(egg, "PaymentDisabled");
  });

  it("reverts for contract senders that cannot hold NFTs, so their ETH returns", async () => {
    const { egg } = await deploy();
    const wallet = await (await ethers.getContractFactory("NonReceiverWallet")).deploy();
    await expect(wallet.sendETH(await egg.getAddress(), { value: PRICE_ETH })).to.be.revertedWithCustomError(
      egg,
      "ERC721InvalidReceiver",
    );
  });
});

// ---------------------------------------------------------------------------
describe("AGIEgg — supply, reentrancy, hatching, metadata, admin", () => {
  it("never exceeds max supply; a direct send mints what is left and refunds", async () => {
    const { agi, egg, alice, bob } = await deploy({ maxSupply: 3 });
    const to = await egg.getAddress();
    await agi.connect(alice).transfer(to, PRICE_AGI * 5n);
    expect(await egg.totalMinted()).to.equal(3);
    expect(await agi.balanceOf(alice.address)).to.equal(E(100_000) - PRICE_AGI * 3n);
    await expect(agi.connect(bob).transfer(to, PRICE_AGI)).to.be.revertedWithCustomError(egg, "SoldOut");
    await agi.connect(bob).approve(to, PRICE_AGI);
    await expect(egg.connect(bob).mintWithAGI(0, 1, PRICE_AGI)).to.be.revertedWithCustomError(egg, "SoldOut");
  });

  it("blocks re-entry during minting", async () => {
    const { egg } = await deploy();
    const attacker = await (await ethers.getContractFactory("ReentrantReceiver")).deploy(await egg.getAddress());
    await expect(attacker.attack(0, { value: PRICE_ETH })).to.be.revertedWithCustomError(
      egg,
      "ReentrancyGuardReentrantCall",
    );
    expect(await egg.totalMinted()).to.equal(0);
  });

  it("keeps hatching closed until enabled, then enforces owner and holding", async () => {
    const { agi, egg, alice, bob } = await deploy();
    await agi.connect(alice).transfer(await egg.getAddress(), PRICE_AGI);
    await expect(egg.connect(alice).hatch(1)).to.be.revertedWithCustomError(egg, "HatchingClosed");

    await egg.setHatchingOpen(true);
    await expect(egg.connect(bob).hatch(1)).to.be.revertedWithCustomError(egg, "NotEggOwner");

    await agi.connect(alice).transfer(bob.address, await agi.balanceOf(alice.address));
    await expect(egg.connect(alice).hatch(1)).to.be.revertedWithCustomError(egg, "HoldTooLow");

    await agi.connect(bob).transfer(alice.address, MIN_HOLD);
    await expect(egg.connect(alice).hatch(1)).to.emit(egg, "Hatched").withArgs(1, alice.address);
    await expect(egg.connect(alice).hatch(1)).to.be.revertedWithCustomError(egg, "AlreadyHatched");
    expect((await egg.eggOf(1)).hatched).to.equal(true);
  });

  it("serves valid on-chain JSON metadata", async () => {
    const { agi, egg, alice } = await deploy();
    await agi.connect(alice).approve(await egg.getAddress(), PRICE_AGI);
    await egg.connect(alice).mintWithAGI(42, 1, PRICE_AGI);
    const meta = decodeURI(await egg.tokenURI(1));
    expect(meta.name).to.equal("AGI.Pets Egg #1");
    expect(meta.image).to.equal(IMAGE_BASE + "42");
    expect(meta.attributes).to.deep.equal([
      { trait_type: "Design", value: 42 },
      { trait_type: "State", value: "Sealed" },
    ]);
    await expect(egg.tokenURI(99)).to.be.revertedWithCustomError(egg, "ERC721NonexistentToken");
  });

  it("restricts admin functions and never shrinks the design range", async () => {
    const { egg, alice } = await deploy();
    for (const call of [
      () => egg.connect(alice).setPrices(1, 1),
      () => egg.connect(alice).setTreasury(alice.address),
      () => egg.connect(alice).setDesignCount(200),
      () => egg.connect(alice).setHatchingOpen(true),
      () => egg.connect(alice).setMinHoldToHatch(0),
      () => egg.connect(alice).setImageBaseURI("x"),
      () => egg.connect(alice).pause(),
    ]) {
      await expect(call()).to.be.revertedWithCustomError(egg, "OwnableUnauthorizedAccount");
    }
    await expect(egg.setDesignCount(10)).to.be.revertedWithCustomError(egg, "DesignCountDecrease");
    await expect(egg.setImageBaseURI('https://x/"bad')).to.be.revertedWithCustomError(egg, "InvalidURI");
    await expect(egg.setImageBaseURI("https://x/\\bad")).to.be.revertedWithCustomError(egg, "InvalidURI");
    await egg.setDesignCount(114);
    expect(await egg.designCount()).to.equal(114);
  });
});

// ---------------------------------------------------------------------------
describe("ComputeTreasury", () => {
  const domain = async (treasury) => ({
    name: "AGI.Pets ComputeTreasury",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await treasury.getAddress(),
  });
  const types = {
    Payout: [
      { name: "provider", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "batchId", type: "bytes32" },
      { name: "deadline", type: "uint256" },
    ],
  };

  it("converts AGI to compute credits at 10 per AGI", async () => {
    const { agi, treasury, alice } = await deploy();
    await agi.connect(alice).approve(await treasury.getAddress(), E(7));
    await expect(treasury.connect(alice).convertToCredits(E(7)))
      .to.emit(treasury, "CreditsPurchased")
      .withArgs(alice.address, E(7), E(70));
    expect(await treasury.creditsOf(alice.address)).to.equal(E(70));
    await expect(treasury.connect(alice).convertToCredits(0)).to.be.revertedWithCustomError(treasury, "ZeroAmount");
  });

  it("pays a provider once for a valid orchestrator receipt", async () => {
    const { agi, treasury, orchestrator, provider, stranger } = await deploy();
    await agi.transfer(await treasury.getAddress(), E(1000));
    await treasury.setProvider(provider.address, true);
    const deadline = (await time.latest()) + 3600;
    const value = { provider: provider.address, amount: E(100), batchId: ethers.id("batch-1"), deadline };
    const sig = await orchestrator.signTypedData(await domain(treasury), types, value);

    await expect(treasury.connect(provider).claim(value.amount, value.batchId, deadline, sig))
      .to.emit(treasury, "ProviderPaid")
      .withArgs(provider.address, E(100), value.batchId);
    expect(await agi.balanceOf(provider.address)).to.equal(E(100));

    await expect(treasury.connect(provider).claim(value.amount, value.batchId, deadline, sig)).to.be.revertedWithCustomError(
      treasury,
      "AlreadyPaid",
    );

    // another account cannot reuse the receipt
    await treasury.setProvider(stranger.address, true);
    const other = { ...value, batchId: ethers.id("batch-2") };
    const sig2 = await orchestrator.signTypedData(await domain(treasury), types, other);
    await expect(treasury.connect(stranger).claim(other.amount, other.batchId, deadline, sig2)).to.be.revertedWithCustomError(
      treasury,
      "BadSignature",
    );
  });

  it("rejects expired receipts, wrong signers and non-providers", async () => {
    const { agi, treasury, provider, stranger } = await deploy();
    await agi.transfer(await treasury.getAddress(), E(1000));
    const deadline = (await time.latest()) + 3600;
    const value = { provider: provider.address, amount: E(1), batchId: ethers.id("b"), deadline };
    const forged = await stranger.signTypedData(await domain(treasury), types, value);

    await expect(treasury.connect(provider).claim(E(1), value.batchId, deadline, forged)).to.be.revertedWithCustomError(
      treasury,
      "NotProvider",
    );
    await treasury.setProvider(provider.address, true);
    await expect(treasury.connect(provider).claim(E(1), value.batchId, deadline, forged)).to.be.revertedWithCustomError(
      treasury,
      "BadSignature",
    );
    await time.increaseTo(deadline + 1);
    await expect(treasury.connect(provider).claim(E(1), value.batchId, deadline, forged)).to.be.revertedWithCustomError(
      treasury,
      "Expired",
    );
  });

  it("restricts withdrawals to the owner", async () => {
    const { treasury, alice } = await deploy();
    await expect(treasury.connect(alice).withdrawETH(alice.address, 1)).to.be.revertedWithCustomError(
      treasury,
      "OwnableUnauthorizedAccount",
    );
    await expect(
      treasury.connect(alice).withdrawToken(await treasury.agi(), alice.address, 1),
    ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
  });
});

// ---------------------------------------------------------------------------
describe("Property tests (randomized)", function () {
  this.timeout(600_000);

  // Deterministic PRNG so failures are reproducible.
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("direct AGI sends: funds are conserved and never stuck (200 runs)", async () => {
    const ctx = await deploy({ maxSupply: 120 });
    const { agi, egg, treasury } = ctx;
    const users = [ctx.alice, ctx.bob, ctx.carol];
    const eggAddr = await egg.getAddress();
    const tAddr = await treasury.getAddress();
    const r = rng(42);
    let minted = 0n;

    for (let i = 0; i < 200; i++) {
      const u = users[Math.floor(r() * users.length)];
      const amount = (PRICE_AGI * BigInt(Math.floor(r() * 2400))) / 100n + BigInt(Math.floor(r() * 1000));
      const balBefore = await agi.balanceOf(u.address);
      const tBefore = await agi.balanceOf(tAddr);
      const left = 120n - minted;
      let expected = amount / PRICE_AGI;
      if (expected > 10n) expected = 10n;
      if (expected > left) expected = left;

      if (amount === 0n) continue;
      if (expected === 0n) {
        await expect(agi.connect(u).transfer(eggAddr, amount)).to.be.reverted;
        expect(await agi.balanceOf(u.address)).to.equal(balBefore);
      } else {
        await agi.connect(u).transfer(eggAddr, amount);
        minted += expected;
        expect(await agi.balanceOf(u.address)).to.equal(balBefore - expected * PRICE_AGI);
        expect(await agi.balanceOf(tAddr)).to.equal(tBefore + expected * PRICE_AGI);
      }
      expect(await agi.balanceOf(eggAddr)).to.equal(0);
      expect(await egg.totalMinted()).to.equal(minted);
    }
    expect(minted).to.be.lessThanOrEqual(120n);
  });

  it("direct ETH sends: proceeds reach the treasury and nothing stays in the egg contract (150 runs)", async () => {
    const ctx = await deploy({ maxSupply: 90 });
    const { egg, treasury } = ctx;
    const users = [ctx.alice, ctx.bob, ctx.carol];
    const eggAddr = await egg.getAddress();
    const tAddr = await treasury.getAddress();
    const r = rng(7);
    let minted = 0n;

    for (let i = 0; i < 150; i++) {
      const u = users[Math.floor(r() * users.length)];
      const value = (PRICE_ETH * BigInt(Math.floor(r() * 1500))) / 100n + 1n;
      const tBefore = await ethers.provider.getBalance(tAddr);
      const left = 90n - minted;
      let expected = value / PRICE_ETH;
      if (expected > 10n) expected = 10n;
      if (expected > left) expected = left;

      if (expected === 0n) {
        await expect(u.sendTransaction({ to: eggAddr, value })).to.be.reverted;
      } else {
        await u.sendTransaction({ to: eggAddr, value });
        minted += expected;
        expect(await ethers.provider.getBalance(tAddr)).to.equal(tBefore + expected * PRICE_ETH);
      }
      expect(await ethers.provider.getBalance(eggAddr)).to.equal(0);
      expect(await egg.totalMinted()).to.equal(minted);
    }
  });
});
