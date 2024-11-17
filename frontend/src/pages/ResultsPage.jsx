import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState('');
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }
      const web3 = new Web3(window.ethereum);
      await web3.eth.requestAccounts();
      setWalletConnected(true);
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const fetchResults = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const candidateCount = await contract.methods.candidateCount().call();
      const fetchedResults = [];
      for (let i = 0; i < candidateCount; i++) {
        const candidate = await contract.methods.candidates(i).call();
        fetchedResults.push({
          name: candidate.name,
          votes: candidate.voteCount,
        });
      }
      setResults(fetchedResults);

      const winnerName = await contract.methods.getWinner().call();
      setWinner(winnerName);
    } catch (err) {
      setError('Failed to fetch results: ' + err.message);
    }
  };

  useEffect(() => {
    connectWallet();
    fetchResults();
  }, []);

  return (
    <div>
      <h1>Voting Results</h1>
      {!walletConnected && <button onClick={connectWallet}>Connect Wallet</button>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {results.map((r, index) => (
          <li key={index}>
            {r.name} - Votes: {r.votes}
          </li>
        ))}
      </ul>
      {winner && <h2>Winner: {winner}</h2>}
    </div>
  );
};

export default ResultsPage;
