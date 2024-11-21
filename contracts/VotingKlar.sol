// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract VotingKlar {
    // Struct to represent a candidate in the voting session
    struct Candidate {
        string name; // Candidate's name
        uint voteCount; // Number of votes received by the candidate
    }

    // Struct to represent a voting session
    struct VotingSession {
        uint id; // Unique identifier for the session
        string title; // Title of the voting session
        uint startTime; // Timestamp when the session starts
        uint endTime; // Timestamp when the session ends
        Candidate[] candidates; // List of candidates in the session
        mapping(address => bool) hasVoted; // Mapping to track if an address has voted
        bool isActive; // Status of the session (active/inactive)
        address creator; // Address of the session creator
    }

    uint public sessionCount; // Counter to keep track of the total number of sessions
    mapping(uint => VotingSession) public votingSessions; // Mapping of session ID to VotingSession

    // Events to log activities in the contract
    event VotingSessionCreated(address indexed creator, uint sessionId, string title, uint startTime, uint endTime);
    event CandidateAdded(uint indexed sessionId, string candidateName);
    event VoteCast(address indexed voter, uint indexed sessionId, uint candidateId);
    event SessionArchived(uint indexed sessionId);

    // Modifier to ensure a function is called only during the voting period
    modifier onlyDuringVotingPeriod(uint sessionId) {
        require(
            block.timestamp >= votingSessions[sessionId].startTime &&
            block.timestamp <= votingSessions[sessionId].endTime,
            "Voting is not active for this session"
        );
        _;
    }

    // Modifier to check if a voting session exists
    modifier sessionExists(uint sessionId) {
        require(votingSessions[sessionId].id == sessionId, "Session does not exist");
        _;
    }

    // Modifier to restrict access to the session creator
    modifier onlySessionCreator(uint sessionId) {
        require(
            msg.sender == votingSessions[sessionId].creator,
            "Only the session creator can perform this action"
        );
        _;
    }

    /**
     * @notice Create a new voting session
     * @param title The title of the voting session
     * @param startTime The start time of the voting session (timestamp)
     * @param endTime The end time of the voting session (timestamp)
     */
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
        session.creator = msg.sender;

        emit VotingSessionCreated(msg.sender, sessionCount, title, startTime, endTime);

        sessionCount++;
    }

    /**
     * @notice Add a candidate to a voting session
     * @param sessionId The ID of the voting session
     * @param name The name of the candidate
     */
    function addCandidate(uint sessionId, string memory name)
        public
        sessionExists(sessionId)
        onlySessionCreator(sessionId)
    {
        VotingSession storage session = votingSessions[sessionId];
        session.candidates.push(Candidate(name, 0));

        emit CandidateAdded(sessionId, name);
    }

    /**
     * @notice Cast a vote for a candidate in a session
     * @param sessionId The ID of the voting session
     * @param candidateId The ID of the candidate
     */
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

        emit VoteCast(msg.sender, sessionId, candidateId);
    }

    /**
     * @notice Archive a voting session after it has ended
     * @param sessionId The ID of the voting session
     */
    function archiveSession(uint sessionId) public sessionExists(sessionId) {
        VotingSession storage session = votingSessions[sessionId];
        require(block.timestamp > session.endTime, "Cannot archive active session");
        session.isActive = false;

        emit SessionArchived(sessionId);
    }

    /**
     * @notice Retrieve all candidates in a session
     * @param sessionId The ID of the voting session
     * @return An array of Candidate structs
     */
    function getCandidates(uint sessionId)
        public
        view
        sessionExists(sessionId)
        returns (Candidate[] memory)
    {
        return votingSessions[sessionId].candidates;
    }

    /**
     * @notice Get the winner of a voting session
     * @param sessionId The ID of the voting session
     * @return winnerName The name of the winning candidate
     * @return isTie A boolean indicating if the session resulted in a tie
     */
    function getWinner(uint sessionId)
        public
        view
        sessionExists(sessionId)
        returns (string memory winnerName, bool isTie)
    {
        VotingSession storage session = votingSessions[sessionId];

        require(session.candidates.length > 0, "No candidates in the session");

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

        if (tieCount > 1) {
            return ("", true);
        }

        return (winnerName, false);
    }

    /**
     * @notice Check if a user has voted in a session
     * @param sessionId The ID of the voting session
     * @param user The address of the user
     * @return A boolean indicating if the user has voted
     */
    function hasUserVoted(uint sessionId, address user)
        public
        view
        sessionExists(sessionId)
        returns (bool)
    {
        return votingSessions[sessionId].hasVoted[user];
    }

    /**
     * @notice Get the creator of a voting session
     * @param sessionId The ID of the voting session
     * @return The address of the session creator
     */
    function getSessionCreator(uint sessionId)
        public
        view
        sessionExists(sessionId)
        returns (address)
    {
        return votingSessions[sessionId].creator;
    }
}
