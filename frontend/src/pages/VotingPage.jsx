import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../utils/contractConfig';

const VotingPage = () => {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                const candidateCount = await contract.candidateCount();
                const fetchedCandidates = [];
                for (let i = 0; i < candidateCount; i++) {
                    const candidate = await contract.getCandidate(i);
                    fetchedCandidates.push({ id: i, name: candidate[0], votes: candidate[1] });
                }
                setCandidates(fetchedCandidates);
            } catch (error) {
                console.error(error);
            }
        };
        fetchCandidates();
    }, []);

    const vote = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            const tx = await contract.vote(selectedCandidate);
            await tx.wait();

            alert('Vote cast successfully!');
        } catch (error) {
            console.error(error);
            alert('Error casting vote!');
        }
    };

    return (
        <div>
            <h1>Voting Page</h1>
            <ul>
                {candidates.map((c) => (
                    <li key={c.id}>
                        {c.name} - Votes: {c.votes}
                        <button onClick={() => setSelectedCandidate(c.id)}>Vote</button>
                    </li>
                ))}
            </ul>
            {selectedCandidate !== null && (
                <button onClick={vote}>Confirm Vote</button>
            )}
        </div>
    );
};

export default VotingPage;
