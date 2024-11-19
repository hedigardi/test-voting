import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const ResultsPage = () => {
  const [sessions, setSessions] = useState([]);
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
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }
  
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);
  
      const sessionCount = await contract.methods.sessionCount().call();
      console.log('Total Sessions:', sessionCount);
  
      const currentTime = Math.floor(Date.now() / 1000);
      const fetchedSessions = [];
  
      for (let i = 0; i < sessionCount; i++) {
        const session = await contract.methods.votingSessions(i).call();
        const candidates = await contract.methods.getCandidates(i).call();
  
        const isCompleted = currentTime > Number(session.endTime);
        const isNotStarted = currentTime < Number(session.startTime);
        let winner = null;
        let isTie = false;
  
        if (isCompleted && candidates.length > 0) {
          try {
            const result = await contract.methods.getWinner(i).call();
            winner = result[0];
            isTie = result[1];
          } catch (error) {
            console.error(`Error fetching winner for session ${i}:`, error.message);
          }
        }
  
        fetchedSessions.push({
          id: Number(session.id),
          title: session.title,
          startTime: Number(session.startTime),
          endTime: Number(session.endTime),
          status: isCompleted
            ? 'Completed'
            : isNotStarted
            ? 'Not Started'
            : session.isActive
            ? 'Active'
            : 'Inactive',
          winner: candidates.length > 0 ? winner : 'No candidates',
          isTie: candidates.length > 0 && isTie,
          candidates: candidates.map((candidate, index) => ({
            id: index,
            name: candidate.name,
            votes: Number(candidate.voteCount),
          })),
        });
      }
  
      setSessions(fetchedSessions);
      console.log('Fetched Sessions with Results:', fetchedSessions);
    } catch (err) {
      console.error('Error fetching results:', err);
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
      {sessions.length > 0 ? (
        sessions.map((session) => (
          <div key={session.id}>
            <h3>
              {session.title} ({session.status})
            </h3>
            <p>
              Start: {new Date(session.startTime * 1000).toLocaleString()}, End:{' '}
              {new Date(session.endTime * 1000).toLocaleString()}
            </p>
            <ul>
              {session.candidates.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.name} - Votes: {candidate.votes}
                </li>
              ))}
            </ul>
            {session.status === 'Completed' && (
              <p>
                <strong>Winner:</strong>{' '}
                {session.isTie ? (
                  <span style={{ color: 'red' }}>
                    Unfortunately, there is no clear winner, as the result is a tie.
                  </span>
                ) : (
                  session.winner
                )}
              </p>
            )}
          </div>
        ))
      ) : (
        <p>No sessions available.</p>
      )}
    </div>
  );
};

export default ResultsPage;
