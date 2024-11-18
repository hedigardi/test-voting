// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract VotingFinito {
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
        address creator; // Address of the session creator
    }

    uint public sessionCount;
    mapping(uint => VotingSession) public votingSessions;

    // Modifier to ensure voting is allowed during the session's active period
    modifier onlyDuringVotingPeriod(uint sessionId) {
        require(
            block.timestamp >= votingSessions[sessionId].startTime &&
            block.timestamp <= votingSessions[sessionId].endTime,
            "Voting is not active for this session"
        );
        _;
    }

    // Modifier to ensure the session exists
    modifier sessionExists(uint sessionId) {
        require(votingSessions[sessionId].id == sessionId, "Session does not exist");
        _;
    }

    // Modifier to allow only the session creator to perform certain actions
    modifier onlySessionCreator(uint sessionId) {
        require(
            msg.sender == votingSessions[sessionId].creator,
            "Only the session creator can perform this action"
        );
        _;
    }

    // Function to create a new voting session
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
        session.creator = msg.sender; // Set the creator as the sender

        sessionCount++;
    }

    // Function to add a candidate to a session, restricted to session creator
    function addCandidate(uint sessionId, string memory name)
        public
        sessionExists(sessionId)
        onlySessionCreator(sessionId)
    {
        VotingSession storage session = votingSessions[sessionId];
        session.candidates.push(Candidate(name, 0));
    }

    // Function to allow users to cast a vote
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

    // Function to archive a session after its end time
    function archiveSession(uint sessionId) public sessionExists(sessionId) {
        VotingSession storage session = votingSessions[sessionId];
        require(block.timestamp > session.endTime, "Cannot archive active session");
        session.isActive = false;
    }

    // Function to get the list of candidates for a session
    function getCandidates(uint sessionId)
        public
        view
        sessionExists(sessionId)
        returns (Candidate[] memory)
    {
        return votingSessions[sessionId].candidates;
    }

    // Function to determine the winner of a session, with tie handling
    function getWinner(uint sessionId)
        public
        view
        sessionExists(sessionId)
        returns (string memory winnerName, bool isTie)
    {
        VotingSession storage session = votingSessions[sessionId];
        uint maxVotes = 0;
        uint tieCount = 0;

        for (uint i = 0; i < session.candidates.length; i++) {
            if (session.candidates[i].voteCount > maxVotes) {
                maxVotes = session.candidates[i].voteCount;
                winnerName = session.candidates[i].name;
                tieCount = 1;
            } else if (session.candidates[i].voteCount == maxVotes) {
                tieCount++;
            }
        }

        // Check for ties
        if (tieCount > 1) {
            return ("", true); // Indicate a tie with an empty winner name
        }

        return (winnerName, false);
    }

    // Function to check if a user has voted in a session
    function hasUserVoted(uint sessionId, address user)
        public
        view
        sessionExists(sessionId)
        returns (bool)
    {
        return votingSessions[sessionId].hasVoted[user];
    }
}
