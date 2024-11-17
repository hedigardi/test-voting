import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingSystemModule = buildModule('VotingSystemModule', (m) => {
  const votingSystem = m.contract('VotingSystem', []);

  return { votingSystem };
});

export default VotingSystemModule;
