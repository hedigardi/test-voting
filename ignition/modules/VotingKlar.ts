// Import the `buildModule` function from Hardhat Ignition
// `buildModule` is used to define a deployment module for Hardhat
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * A Hardhat Ignition deployment module for the `VotingKlar` contract.
 * This module defines how the `VotingKlar` contract is deployed and 
 * facilitates its integration into the Hardhat Ignition framework.
 */

// Define the deployment module for `VotingKlar`
const VotingKlarModule = buildModule('VotingKlarModule', (m) => {
  /**
   * Deploy the `VotingKlar` contract.
   * 
   * @param {string} name - The name of the contract (`VotingKlar`).
   * @param {any[]} args - Constructor arguments for the contract deployment (empty array in this case).
   * @returns {object} - A reference to the deployed contract.
   */
  const votingKlar = m.contract('VotingKlar', []);

  // Return the deployed contract for use in other parts of the application
  return { votingKlar };
});

// Export the module so it can be used by Hardhat's Ignition framework
export default VotingKlarModule;
