import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const AdminPanel = () => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessions, setSessions] = useState([]);
  const [candidatesBySession, setCandidatesBySession] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');

  const handleError = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      setWalletConnected(true);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      handleError('Failed to connect wallet: ' + err.message);
    }
  };

  const handleAccountChange = (accounts) => {
    if (accounts.length > 0) {
      setCurrentAccount(accounts[0]);
      fetchSessions(); // Refresh sessions for the new account
    } else {
      setWalletConnected(false);
      setCurrentAccount('');
    }
  };

  const createSession = async () => {
    try {
      if (!title || !startTime || !endTime) {
        throw new Error('All fields are required to create a session.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      const startTimeUnix = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimeUnix = Math.floor(new Date(endTime).getTime() / 1000);

      if (startTimeUnix >= endTimeUnix) {
        throw new Error('Start time must be before end time.');
      }

      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const tx = await contract.methods
        .createVotingSession(title, startTimeUnix, endTimeUnix)
        .send({ from: account });
      console.log('Session created. Transaction hash:', tx.transactionHash);

      fetchSessions();
    } catch (err) {
      console.error('Error creating session:', err);
      handleError('Failed to create session: ' + err.message);
    }
  };

  const fetchSessions = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const sessionCount = await contract.methods.sessionCount().call();
      const currentTime = Math.floor(Date.now() / 1000);
      const fetchedSessions = [];

      for (let i = 0; i < sessionCount; i++) {
        const session = await contract.methods.votingSessions(i).call();
        const creator = await contract.methods.getSessionCreator(i).call(); // Fetch creator
        const isCompleted = currentTime > Number(session.endTime);
        const isNotStarted = currentTime < Number(session.startTime);

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
          creator,
        });
      }

      fetchedSessions.sort((a, b) => {
        const statusOrder = {
          Active: 1,
          'Not Started': 2,
          Completed: 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setSessions(fetchedSessions);

      for (const session of fetchedSessions) {
        fetchCandidates(session.id);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      handleError('Failed to fetch sessions: ' + err.message);
    }
  };

  const fetchCandidates = async (sessionId) => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const candidates = await contract.methods.getCandidates(sessionId).call();
      setCandidatesBySession((prev) => ({
        ...prev,
        [sessionId]: candidates.map((candidate, index) => ({
          id: index,
          name: candidate.name,
          votes: candidate.voteCount,
        })),
      }));
    } catch (err) {
      console.error(`Error fetching candidates for session ${sessionId}:`, err);
    }
  };

  const addCandidate = async () => {
    try {
      if (!selectedSessionId || candidateName.trim() === '') {
        throw new Error('Please select a valid session and enter a candidate name.');
      }

      const sessionId = Number(selectedSessionId);
      if (isNaN(sessionId)) {
        throw new Error('Invalid session ID.');
      }

      const selectedSession = sessions.find((session) => session.id === sessionId);
      if (!selectedSession) {
        throw new Error('Selected session does not exist.');
      }

      // Normalize addresses for comparison
      if (selectedSession.creator.toLowerCase() !== currentAccount.toLowerCase()) {
        throw new Error('Only the creator of this voting session can add candidates.');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime >= selectedSession.startTime) {
        throw new Error('Candidates cannot be added during the voting period.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const tx = await contract.methods
        .addCandidate(sessionId, candidateName)
        .send({ from: account });
      console.log('Candidate added. Transaction hash:', tx.transactionHash);

      setCandidateName('');
      fetchCandidates(sessionId);
      handleError('Candidate added successfully.');
    } catch (err) {
      console.error('Error adding candidate:', err);
      handleError('Failed to add candidate: ' + err.message);
    }
  };

  useEffect(() => {
    // Connect wallet on component load and fetch sessions
    connectWallet();
    fetchSessions();

    // Add a listener for account changes in MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]); // Update the current account
          fetchSessions(); // Fetch sessions again to ensure creator logic works
        } else {
          setWalletConnected(false); // Handle wallet disconnection
          setCurrentAccount('');
        }
      });
    }

    // Cleanup listener on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Show the connect wallet button if the wallet is not connected */}
      {!walletConnected && <button onClick={connectWallet}>Connect Wallet</button>}
      {walletConnected && (
        <>
          <div>
            {/* Display error messages, if any */}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <h3>Create Voting Session</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Voting Title"
            />
            <label>
              Start Time:
              <input type="datetime-local" onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label>
              End Time:
              <input type="datetime-local" onChange={(e) => setEndTime(e.target.value)} />
            </label>
            <button onClick={createSession}>Create Voting Session</button>
          </div>

          <div>
            <h3>Add Candidate</h3>
            <label>
              Select Session:
              {/* Dropdown to select a session for adding candidates */}
              <select
                onChange={(e) => setSelectedSessionId(e.target.value)}
                value={selectedSessionId || ''}
              >
                <option value="" disabled>
                  Select a session
                </option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Candidate Name"
            />
            {/* Button to trigger the addition of a candidate */}
            <button onClick={addCandidate}>Add Candidate</button>
          </div>

          <div>
            <h3>Sessions and Candidates</h3>
            <ul>
              {/* Display all sessions and their candidates */}
              {sessions.map((session) => (
                <li key={session.id}>
                  {session.title} ({session.status}){' '}
                  (Start: {new Date(session.startTime * 1000).toLocaleString()}, End:{' '}
                  {new Date(session.endTime * 1000).toLocaleString()})
                  <ul>
                    {/* List of candidates for the session */}
                    {candidatesBySession[session.id]?.map((candidate) => (
                      <li key={candidate.id}>{candidate.name}</li>
                    )) || <li>No candidates added yet.</li>}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
