// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract Voting {
    struct Candidate {
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint public candidateCount;

    function addCandidate(string memory _name) public {
        candidates[candidateCount++] = Candidate(_name, 0);
    }

    function vote(uint _candidateId) public {
        require(!hasVoted[msg.sender], "Already voted.");
        require(_candidateId < candidateCount, "Invalid candidate.");
        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;
    }

    function getCandidate(uint _candidateId) public view returns (string memory, uint) {
        Candidate storage candidate = candidates[_candidateId];
        return (candidate.name, candidate.voteCount);
    }
}
