// Deploys ComputeTreasury, AGIToken and AGIEgg, wires them together and
// writes the addresses to deployments/<network>.json.
//
// Usage (local):  npx hardhat run scripts/deploy.js
// Usage (real):   RPC_URL=... DEPLOYER_KEY=... ORCHESTRATOR=0x... \
//                 npx hardhat run scripts/deploy.js --network target
//
// Optional env: AGI_HOLDER, PRICE_AGI (whole AGI), PRICE_ETH (ETH),
// MIN_HOLD (whole AGI), MAX_SUPPLY, DESIGN_COUNT, IMAGE_BASE.

const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const env = process.env;

  const cfg = {
    agiHolder: env.AGI_HOLDER || deployer.address,
    orchestrator: env.ORCHESTRATOR || deployer.address,
    priceAGI: ethers.parseEther(env.PRICE_AGI || "500"),
    priceETH: ethers.parseEther(env.PRICE_ETH || "0.01"),
    minHold: ethers.parseEther(env.MIN_HOLD || "500"),
    maxSupply: Number(env.MAX_SUPPLY || 5000),
    designCount: Number(env.DESIGN_COUNT || 108),
    imageBase: env.IMAGE_BASE || "https://agieggs.vercel.app/api/egg-image/",
  };
  if (network.name !== "hardhat" && !env.ORCHESTRATOR) {
    throw new Error("Set ORCHESTRATOR to the payout-signing address before deploying to a live network.");
  }

  // The treasury and token reference each other: predict the token address.
  const nonce = await deployer.getNonce();
  const agiAddr = ethers.getCreateAddress({ from: deployer.address, nonce: nonce + 1 });

  const treasury = await (await ethers.getContractFactory("ComputeTreasury")).deploy(agiAddr, cfg.orchestrator);
  await treasury.waitForDeployment();
  const agi = await (await ethers.getContractFactory("AGIToken")).deploy(cfg.agiHolder, await treasury.getAddress());
  await agi.waitForDeployment();
  if ((await agi.getAddress()) !== agiAddr) throw new Error("Token address prediction failed");

  const egg = await (await ethers.getContractFactory("AGIEgg")).deploy(
    agiAddr,
    await treasury.getAddress(),
    cfg.maxSupply,
    cfg.designCount,
    cfg.priceAGI,
    cfg.priceETH,
    cfg.minHold,
    cfg.imageBase,
  );
  await egg.waitForDeployment();
  await (await agi.setReceiverHook(await egg.getAddress(), true)).wait();

  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    ComputeTreasury: await treasury.getAddress(),
    AGIToken: agiAddr,
    AGIEgg: await egg.getAddress(),
    config: {
      ...cfg,
      priceAGI: cfg.priceAGI.toString(),
      priceETH: cfg.priceETH.toString(),
      minHold: cfg.minHold.toString(),
    },
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));

  // Local smoke test: a wallet that never "connects" just sends funds.
  if (network.name === "hardhat") {
    const [, buyer] = await ethers.getSigners();
    await (await agi.transfer(buyer.address, cfg.priceAGI * 2n)).wait();
    await (await agi.connect(buyer).transfer(await egg.getAddress(), cfg.priceAGI)).wait();
    await (await buyer.sendTransaction({ to: await egg.getAddress(), value: cfg.priceETH })).wait();
    console.log(`smoke: buyer owns ${await egg.balanceOf(buyer.address)} eggs after one AGI send and one ETH send`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
