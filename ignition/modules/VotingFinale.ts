import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingFinaleModule = buildModule('VotingFinaleModule', (m) => {
  const votingFinale = m.contract('VotingFinale', []);

  return { votingFinale };
});

export default VotingFinaleModule;
