// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract VotingSystem {
    struct Candidate {
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidateCount;

    mapping(address => bool) public hasVoted;
    uint public startTime;
    uint public endTime;

    modifier onlyDuringVotingPeriod() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Voting is not active");
        _;
    }

    modifier onlyOutsideVotingPeriod() {
        require(block.timestamp < startTime || block.timestamp > endTime, "Action restricted to non-voting periods");
        _;
    }

    function addCandidate(string memory name) public onlyOutsideVotingPeriod {
        candidates[candidateCount++] = Candidate(name, 0);
    }

    function setVotingPeriod(uint _startTime, uint _endTime) public onlyOutsideVotingPeriod {
        require(_endTime > _startTime, "End time must be after start time");
        startTime = _startTime;
        endTime = _endTime;
    }

    function vote(uint candidateId) public onlyDuringVotingPeriod {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateId < candidateCount, "Invalid candidate ID");
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
    }

    function getWinner() public view returns (string memory winnerName) {
        uint maxVotes = 0;
        for (uint i = 0; i < candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerName = candidates[i].name;
            }
        }
    }
}
