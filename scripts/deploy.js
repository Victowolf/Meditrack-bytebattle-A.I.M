const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const doctorAddress = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

  const EHR = await hre.ethers.getContractFactory("EHR");
  const ehr = await EHR.deploy(adminAddress, doctorAddress); // already deployed in ethers v6

  console.log("EHR contract deployed to:", await ehr.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
