import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingKlarModule = buildModule('VotingKlarModule', (m) => {
  const votingKlar = m.contract('VotingKlar', []);

  return { votingKlar };
});

export default VotingKlarModule;
