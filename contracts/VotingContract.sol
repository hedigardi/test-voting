// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract VotingContract {
    struct Candidate {
        string name;
        uint voteCount;
    }

    struct VotingSession {
        uint id;
        string title;
        uint startTime;
        uint endTime;
        Candidate[] candidates;
        mapping(address => bool) hasVoted;
        bool isActive;
    }

    uint public sessionCount;
    mapping(uint => VotingSession) public votingSessions;

    modifier onlyDuringVotingPeriod(uint sessionId) {
        require(
            block.timestamp >= votingSessions[sessionId].startTime &&
            block.timestamp <= votingSessions[sessionId].endTime,
            "Voting is not active for this session"
        );
        _;
    }

    modifier onlyOutsideVotingPeriod(uint sessionId) {
        require(
            block.timestamp < votingSessions[sessionId].startTime ||
            block.timestamp > votingSessions[sessionId].endTime,
            "Action restricted to non-voting periods for this session"
        );
        _;
    }

    modifier sessionExists(uint sessionId) {
        require(votingSessions[sessionId].id == sessionId, "Session does not exist");
        _;
    }

    function createVotingSession(
        string memory title,
        uint startTime,
        uint endTime
    ) public {
        require(endTime > startTime, "End time must be after start time");
        VotingSession storage session = votingSessions[sessionCount];
        session.id = sessionCount;
        session.title = title;
        session.startTime = startTime;
        session.endTime = endTime;
        session.isActive = true;

        sessionCount++;
    }

    function addCandidate(uint sessionId, string memory name)
        public
        onlyOutsideVotingPeriod(sessionId)
        sessionExists(sessionId)
    {
        VotingSession storage session = votingSessions[sessionId];
        session.candidates.push(Candidate(name, 0));
    }

    function vote(uint sessionId, uint candidateId)
        public
        onlyDuringVotingPeriod(sessionId)
        sessionExists(sessionId)
    {
        VotingSession storage session = votingSessions[sessionId];
        require(!session.hasVoted[msg.sender], "You have already voted");
        require(candidateId < session.candidates.length, "Invalid candidate ID");

        session.hasVoted[msg.sender] = true;
        session.candidates[candidateId].voteCount++;
    }

    function archiveSession(uint sessionId) public sessionExists(sessionId) {
        VotingSession storage session = votingSessions[sessionId];
        require(block.timestamp > session.endTime, "Cannot archive active session");
        session.isActive = false;
    }

    function getCandidates(uint sessionId) public view sessionExists(sessionId) returns (Candidate[] memory) {
        return votingSessions[sessionId].candidates;
    }

    function getWinner(uint sessionId) public view sessionExists(sessionId) returns (string memory winnerName) {
        VotingSession storage session = votingSessions[sessionId];
        uint maxVotes = 0;

        for (uint i = 0; i < session.candidates.length; i++) {
            if (session.candidates[i].voteCount > maxVotes) {
                maxVotes = session.candidates[i].voteCount;
                winnerName = session.candidates[i].name;
            }
        }
    }
}
