import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../utils/contractConfig';

const AdminPanel = () => {
    const [candidate, setCandidate] = useState('');

    const addCandidate = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            const tx = await contract.addCandidate(candidate);
            await tx.wait();

            alert('Candidate added successfully!');
            setCandidate('');
        } catch (error) {
            console.error(error);
            alert('Error adding candidate!');
        }
    };

    return (
        <div>
            <h1>Admin Panel</h1>
            <input
                type="text"
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                placeholder="Candidate Name"
            />
            <button onClick={addCandidate}>Add Candidate</button>
        </div>
    );
};

export default AdminPanel;
