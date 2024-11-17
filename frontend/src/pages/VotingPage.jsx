import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const VotingPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts(); // Request wallet connection
      console.log('Connected account:', accounts[0]);
      setWalletConnected(true);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const fetchCandidates = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      console.log('Fetching candidates...');

      const candidateCount = await contract.methods.candidateCount().call();
      const fetchedCandidates = [];

      for (let i = 0; i < candidateCount; i++) {
        const candidate = await contract.methods.candidates(i).call();
        fetchedCandidates.push({
          id: i,
          name: candidate.name,
          votes: candidate.voteCount,
        });
      }

      setCandidates(fetchedCandidates);
      console.log('Candidates fetched:', fetchedCandidates);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to fetch candidates: ' + err.message);
    }
  };

  const voteForCandidate = async (candidateId) => {
    setVotingInProgress(true);
    setError('');
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      const contract = new web3.eth.Contract(contractABI, contractAddress);

      console.log(`Voting for candidate ID ${candidateId}...`);

      const tx = await contract.methods.vote(candidateId).send({ from: account });
      console.log('Vote transaction hash:', tx.transactionHash);

      fetchCandidates(); // Refresh the candidates list to show updated vote counts
    } catch (err) {
      console.error('Error voting for candidate:', err);
      setError('Failed to vote: ' + err.message);
    } finally {
      setVotingInProgress(false);
    }
  };

  useEffect(() => {
    connectWallet();
    fetchCandidates();
  }, []);

  return (
    <div>
      <h1>Voting Page</h1>
      {!walletConnected && <button onClick={connectWallet}>Connect Wallet</button>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {candidates.map((candidate) => (
          <li key={candidate.id}>
            {candidate.name} - Votes: {candidate.votes}
            <button
              onClick={() => voteForCandidate(candidate.id)}
              disabled={votingInProgress}
            >
              {votingInProgress ? 'Voting...' : 'Vote'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VotingPage;
