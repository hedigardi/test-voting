// Import the `buildModule` function from Hardhat Ignition
// `buildModule` is used to define a deployment module for Hardhat
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * A Hardhat Ignition deployment module for the `VotingContract2` contract.
 * This module defines how the `VotingContract2` contract is deployed and 
 * facilitates its integration into the Hardhat Ignition framework.
 */

// Define the deployment module for `VotingContract2`
const VotingContract2Module = buildModule('VotingContract2Module', (m) => {
  /**
   * Deploy the `VotingContract2` contract.
   * 
   * @param {string} name - The name of the contract (`VotingContract2`).
   * @param {any[]} args - Constructor arguments for the contract deployment (empty array in this case).
   * @returns {object} - A reference to the deployed contract.
   */
  const votingContract2 = m.contract('VotingContract2', []);

  // Return the deployed contract for use in other parts of the application
  return { votingContract2 };
});

// Export the module so it can be used by Hardhat's Ignition framework
export default VotingContract2Module;
