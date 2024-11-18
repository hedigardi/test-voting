import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingFinitoModule = buildModule('VotingFinitoModule', (m) => {
  const votingFinito = m.contract('VotingFinito', []);

  return { votingFinito };
});

export default VotingFinitoModule;
