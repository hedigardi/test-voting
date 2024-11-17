import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../utils/contractConfig';

const AdminPanel = () => {
  const [candidate, setCandidate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      console.log('Connected account:', accounts[0]);
      setWalletConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage('Failed to connect wallet: ' + error.message);
    }
  };

  const addCandidate = async () => {
    setIsAdding(true);
    setErrorMessage('');
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      console.log('Adding candidate:', candidate);

      const tx = await contract.methods.addCandidate(candidate).send({ from: account });
      const transactionHash = tx.transactionHash;

      setTxHash(transactionHash);
      setCandidate('');
      console.log('Candidate added successfully. Transaction hash:', transactionHash);
    } catch (error) {
      console.error('Error adding candidate:', error);
      setErrorMessage('Failed to add candidate: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const setVotingPeriod = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      if (endTimestamp <= startTimestamp) {
        throw new Error('End time must be after start time.');
      }

      console.log('Setting voting period:', startTimestamp, endTimestamp);

      const tx = await contract.methods.setVotingPeriod(startTimestamp, endTimestamp).send({ from: account });
      console.log('Voting period set successfully. Transaction hash:', tx.transactionHash);
    } catch (error) {
      console.error('Error setting voting period:', error);
      setErrorMessage('Failed to set voting period: ' + error.message);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div>
      <h1>Admin Panel</h1>
      {!walletConnected && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      {walletConnected && (
        <>
          <div>
            <input
              type="text"
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
              placeholder="Candidate Name"
            />
            <button onClick={addCandidate} disabled={isAdding}>
              {isAdding ? 'Adding Candidate...' : 'Add Candidate'}
            </button>
          </div>
          <div>
            <h3>Set Voting Period</h3>
            <label>
              Start Time:
              <input
                type="datetime-local"
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              End Time:
              <input
                type="datetime-local"
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            <button onClick={setVotingPeriod}>Set Voting Period</button>
          </div>
          {txHash && (
            <div>
              <p>Transaction hash: {txHash}</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Etherscan
              </a>
            </div>
          )}
        </>
      )}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default AdminPanel;
