import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VotingSistaModule = buildModule('VotingSistaModule', (m) => {
  const votingSista = m.contract('VotingSista', []);

  return { votingSista };
});

export default VotingSistaModule;
