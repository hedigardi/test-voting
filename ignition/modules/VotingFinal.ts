import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingFinalModule = buildModule('VotingFinalModule', (m) => {
  const votingFinal = m.contract('VotingFinal', []);

  return { votingFinal };
});

export default VotingFinalModule;
