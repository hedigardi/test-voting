import { HardhatUserConfig, vars } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

// Environment variables to keep sensitive data secure
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY'); // Etherscan API key for contract verification
const ALCHEMY_API_KEY = vars.get('ALCHEMY_API_KEY'); // Alchemy API key for connecting to Sepolia network
const SEPOLIA_PRIVATE_KEY = vars.get('SEPOLIA_PRIVATE_KEY'); // Private key for Sepolia testnet account

// Hardhat configuration object
const config: HardhatUserConfig = {
  solidity: '0.8.27', // Solidity compiler version

  // Etherscan configuration for contract verification
  etherscan: {
    apiKey: ETHERSCAN_API_KEY, // API key for interacting with Etherscan
  },

  // Network configurations
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Alchemy endpoint for Sepolia
      accounts: [SEPOLIA_PRIVATE_KEY], // Private key for deploying contracts to Sepolia
    },
  },

  // Sourcify configuration for source code verification
  sourcify: {
    enabled: true, // Automatically verifies source code on Sourcify
  },
};

export default config;
