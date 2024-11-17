import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState('');
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      console.log('Connected account:', accounts[0]);
      setWalletConnected(true);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const candidateCount = await contract.methods.candidateCount().call();
      const fetchedResults = [];
      let maxVotes = 0;
      let winnerName = '';

      for (let i = 0; i < candidateCount; i++) {
        const candidate = await contract.methods.candidates(i).call();
        fetchedResults.push({
          name: candidate.name,
          votes: Number(candidate.voteCount),
        });

        if (Number(candidate.voteCount) > maxVotes) {
          maxVotes = Number(candidate.voteCount);
          winnerName = candidate.name;
        }
      }

      setResults(fetchedResults);
      setWinner(winnerName);
      console.log('Results fetched:', fetchedResults);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch results: ' + err.message);
    } finally {
      setIsLoading(false);
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
      {isLoading && <p>Loading results...</p>}
      {winner && <h2>Winner: {winner}</h2>}
      <ul>
        {results.length === 0 ? (
          <p>No candidates found or no votes have been cast yet.</p>
        ) : (
          results.map((r, index) => (
            <li key={index}>
              {r.name} - Votes: {r.votes}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ResultsPage;
