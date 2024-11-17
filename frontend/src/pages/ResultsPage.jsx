import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../utils/contractConfig';

const ResultsPage = () => {
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                const candidateCount = await contract.candidateCount();
                const fetchedResults = [];
                for (let i = 0; i < candidateCount; i++) {
                    const candidate = await contract.getCandidate(i);
                    fetchedResults.push({ name: candidate[0], votes: candidate[1] });
                }
                setResults(fetchedResults);
            } catch (error) {
                console.error(error);
            }
        };
        fetchResults();
    }, []);

    return (
        <div>
            <h1>Voting Results</h1>
            <ul>
                {results.map((r, index) => (
                    <li key={index}>
                        {r.name} - Votes: {r.votes}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResultsPage;
