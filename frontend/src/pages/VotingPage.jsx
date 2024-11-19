import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const VotingPage = () => {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [userVotes, setUserVotes] = useState({});

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      console.log('Connected account:', accounts[0]);
      setWalletConnected(true);
      fetchSessions();
    } catch (err) {
      handleError('Failed to connect wallet: ' + err.message);
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
  
      const currentTime = Math.floor(Date.now() / 1000);
      const fetchedSessions = [];
      const userVoteStatus = {};
  
      for (let i = 0; i < sessionCount; i++) {
        const session = await contract.methods.votingSessions(i).call();
        const candidates = await contract.methods.getCandidates(i).call();
        const hasVoted = await contract.methods.hasUserVoted(i, account).call();
  
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
              : currentTime < Number(session.startTime)
              ? 'Not Started'
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
  
      const filteredSessions = fetchedSessions.filter(
        (session) => session.status === 'Not Started' || session.status === 'Active'
      );
  
      // Sort sessions: "Active" first, "Not Started" second
      filteredSessions.sort((a, b) => {
        const statusOrder = { Active: 1, 'Not Started': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
  
      setSessions(filteredSessions);
      setUserVotes(userVoteStatus);
      console.log('Filtered and Sorted Sessions:', filteredSessions);
    } catch (err) {
      handleError('Failed to fetch sessions: ' + err.message);
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

      fetchSessions();
    } catch (err) {
      handleError('Failed to vote: ' + err.message);
    } finally {
      setVotingInProgress(false);
    }
  };

  const handleError = (message) => {
    setError(message);
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  useEffect(() => {
    connectWallet();
    fetchSessions();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          setWalletConnected(false);
          setSessions([]);
        } else {
          fetchSessions();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', fetchSessions);
      }
    };
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="text-center">Voting Page</h1>
      {!walletConnected ? (
        <div className="text-center">
          <p>Connect your wallet to interact with the dApp.</p>
          <button className="btn btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-danger">{error}</div>}
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div className="card mb-4" key={session.id}>
                <div className="card-body">
                  <h3 className="card-title">
                    {session.title}{' '}
                    <span
                      className={`badge bg-${
                        session.status === 'Not Started'
                          ? 'secondary'
                          : session.status === 'Active'
                          ? 'info'
                          : 'success'
                      }`}
                    >
                      {session.status}
                    </span>
                  </h3>
                  <p>
                    <strong>Start:</strong>{' '}
                    {new Date(session.startTime * 1000).toLocaleString()} <br />
                    <strong>End:</strong>{' '}
                    {new Date(session.endTime * 1000).toLocaleString()}
                  </p>
                  {session.hasVoted && (
                    <p className="text-success">You have casted your vote.</p>
                  )}
                  <ul className="list-group">
                    {session.candidates.map((candidate) => (
                      <li
                        className="list-group-item d-flex justify-content-between align-items-center"
                        key={candidate.id}
                      >
                        <span>
                          {candidate.name} {candidate.votes}
                        </span>
                        {session.status === 'Active' && !session.hasVoted && (
                          <button
                            className="btn btn-success"
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
              </div>
            ))
          ) : (
            <p className="text-center">No voting sessions available.</p>
          )}
        </>
      )}
    </div>
  );
};

export default VotingPage;
