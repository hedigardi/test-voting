import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const VotingPage = () => {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [userVotes, setUserVotes] = useState({}); // Track if the user has voted for each session

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

  const fetchSessions = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      const sessionCount = await contract.methods.sessionCount().call();
      console.log('Total Sessions:', sessionCount);

      const currentTime = Math.floor(Date.now() / 1000); // Get current UNIX timestamp
      const fetchedSessions = [];
      const userVoteStatus = {}; // To store vote status for each session

      for (let i = 0; i < sessionCount; i++) {
        const session = await contract.methods.votingSessions(i).call();
        const candidates = await contract.methods.getCandidates(i).call();
        const hasVoted = await contract.methods.hasUserVoted(i, account).call(); // Check if user has voted

        userVoteStatus[i] = hasVoted;

        const isCompleted = currentTime > Number(session.endTime);
        fetchedSessions.push({
          id: Number(session.id),
          title: session.title,
          startTime: Number(session.startTime),
          endTime: Number(session.endTime),
          status: session.isActive
            ? isCompleted
              ? 'Completed'
              : 'Active'
            : 'Inactive',
          hasVoted,
          candidates: candidates.map((candidate, index) => ({
            id: index,
            name: candidate.name,
            votes: candidate.voteCount,
          })),
        });
      }

      // Filter to include only active sessions
      const activeSessions = fetchedSessions.filter((session) => session.status === 'Active');

      setSessions(activeSessions); // Only set active sessions
      setUserVotes(userVoteStatus); // Set the vote status for all sessions
      console.log('Fetched and filtered active Sessions:', activeSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch sessions: ' + err.message);
    }
  };

  const voteForCandidate = async (sessionId, candidateId) => {
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

      console.log(`Voting for candidate ID ${candidateId} in session ID ${sessionId}...`);

      const tx = await contract.methods.vote(sessionId, candidateId).send({ from: account });
      console.log('Vote transaction hash:', tx.transactionHash);

      fetchSessions(); // Refresh the sessions to show updated vote counts
    } catch (err) {
      console.error('Error voting for candidate:', err);
      setError('Failed to vote: ' + err.message);
    } finally {
      setVotingInProgress(false);
    }
  };

  useEffect(() => {
    connectWallet();
    fetchSessions();
  }, []);

  return (
    <div>
      <h1>Voting Page</h1>
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
            {session.hasVoted && <p style={{ color: 'blue' }}>You have casted your vote.</p>}
            <ul>
              {session.candidates.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.name} {candidate.votes}
                  {session.status === 'Active' && !session.hasVoted && (
                    <button
                      onClick={() => voteForCandidate(session.id, candidate.id)}
                      disabled={votingInProgress}
                    >
                      {votingInProgress ? 'Voting...' : 'Vote'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No active sessions available.</p>
      )}
    </div>
  );
};

export default VotingPage;
