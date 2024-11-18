import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingNewModule = buildModule('VotingNewModule', (m) => {
  const votingNew = m.contract('VotingNew', []);

  return { votingNew };
});

export default VotingNewModule;
