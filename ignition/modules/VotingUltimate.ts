import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingUltimateModule = buildModule('VotingUltimateModule', (m) => {
  const votingUltimate = m.contract('VotingUltimate', []);

  return { votingUltimate };
});

export default VotingUltimateModule;
