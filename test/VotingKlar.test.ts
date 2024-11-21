import { expect } from "chai";
import { ethers } from "hardhat";

// Test suite for the VotingKlar smart contract
describe("VotingKlar", function () {
  // Helper function to deploy the VotingKlar contract and set up signers
  async function deployVotingFixture() {
    const [owner, user1, user2] = await ethers.getSigners(); // Get test accounts

    const VotingKlar = await ethers.getContractFactory("VotingKlar"); // Fetch contract factory
    const votingKlar = await VotingKlar.deploy(); // Deploy the contract

    return { votingKlar, owner, user1, user2 }; // Return deployed contract and accounts
  }

  // Test cases related to contract deployment
  describe("Deployment", function () {
    it("Should deploy with an initial session count of 0", async function () {
      const { votingKlar } = await deployVotingFixture();
      expect(await votingKlar.sessionCount()).to.equal(0); // Check initial session count
    });
  });

  // Test cases for creating a voting session
  describe("createVotingSession", function () {
    it("Should create a voting session", async function () {
      const { votingKlar, owner } = await deployVotingFixture();
  
      const startTime = Math.floor(Date.now() / 1000) + 100; // Future start time
      const endTime = startTime + 600; // End time after start time
  
      // Expect the VotingSessionCreated event to be emitted with the correct arguments
      await expect(
        votingKlar.createVotingSession("Test Voting", startTime, endTime)
      )
        .to.emit(votingKlar, "VotingSessionCreated")
        .withArgs(owner.address, 0, "Test Voting", startTime, endTime);

      // Verify session details
      const session = await votingKlar.votingSessions(0);
      expect(session.title).to.equal("Test Voting");
      expect(session.startTime).to.equal(startTime);
      expect(session.endTime).to.equal(endTime);
      expect(session.creator).to.equal(owner.address);
    });
  
    it("Should fail if end time is before start time", async function () {
      const { votingKlar } = await deployVotingFixture();
  
      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime - 100; // Invalid end time
  
      // Expect the transaction to revert with an error
      await expect(
        votingKlar.createVotingSession("Invalid Voting", startTime, endTime)
      ).to.be.revertedWith("End time must be after start time");
    });
  });

  // Test cases for adding candidates
  describe("addCandidate", function () {
    it("Should allow session creator to add a candidate", async function () {
      const { votingKlar, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Voting with Candidates", startTime, endTime);

      // Add a candidate and expect the CandidateAdded event to be emitted
      await expect(votingKlar.addCandidate(0, "Candidate 1"))
        .to.emit(votingKlar, "CandidateAdded")
        .withArgs(0, "Candidate 1");

      // Verify candidate details
      const candidates = await votingKlar.getCandidates(0);
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Candidate 1");
    });

    it("Should fail if called by a non-creator", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Unauthorized Add", startTime, endTime);

      // Expect transaction to revert with the correct error message
      await expect(
        votingKlar.connect(user1).addCandidate(0, "Candidate 2")
      ).to.be.revertedWith("Only the session creator can perform this action");
    });

    it("Should fail if session does not exist", async function () {
      const { votingKlar } = await deployVotingFixture();

      // Attempt to add a candidate to a non-existent session
      await expect(
        votingKlar.addCandidate(1, "Nonexistent Candidate")
      ).to.be.revertedWith("Session does not exist");
    });

    it("Should allow adding multiple candidates", async function () {
      const { votingKlar, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Multiple Candidates", startTime, endTime);

      // Add multiple candidates and verify their details
      await expect(votingKlar.addCandidate(0, "Candidate 1"))
        .to.emit(votingKlar, "CandidateAdded")
        .withArgs(0, "Candidate 1");

      await expect(votingKlar.addCandidate(0, "Candidate 2"))
        .to.emit(votingKlar, "CandidateAdded")
        .withArgs(0, "Candidate 2");

      const candidates = await votingKlar.getCandidates(0);
      expect(candidates.length).to.equal(2);
      expect(candidates[1].name).to.equal("Candidate 2");
    });
  });

  // Test cases for voting functionality
  describe("vote", function () {
    it("Should allow voting during the voting period", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Voting Session", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cast a vote and expect the VoteCast event to be emitted
      await expect(votingKlar.connect(user1).vote(0, 0))
        .to.emit(votingKlar, "VoteCast")
        .withArgs(user1.address, 0, 0);

      const candidates = await votingKlar.getCandidates(0);
      expect(candidates[0].voteCount).to.equal(1);
    });

    // Additional test cases for edge cases, including invalid votes and duplicate votes
    it("Should fail if voting outside the voting period", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Early Voting", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");

      await expect(
        votingKlar.connect(user1).vote(0, 0)
      ).to.be.revertedWith("Voting is not active for this session");
    });

    it("Should fail if user has already voted", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Duplicate Voting", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingKlar.connect(user1).vote(0, 0);

      await expect(
        votingKlar.connect(user1).vote(0, 0)
      ).to.be.revertedWith("You have already voted");
    });

    it("Should fail if voting on a non-existent candidate", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Invalid Candidate Vote", startTime, endTime);

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await expect(
        votingKlar.connect(user1).vote(0, 0)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("Should fail if no candidates exist in the session", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("No Candidates", startTime, endTime);

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await expect(
        votingKlar.connect(user1).vote(0, 0)
      ).to.be.revertedWith("Invalid candidate ID");
    });
  });

  describe("hasUserVoted", function () {
    it("Should return false if the user has not voted", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Voting Session", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");

      const hasVoted = await votingKlar.hasUserVoted(0, user1.address);
      expect(hasVoted).to.equal(false);
    });

    it("Should return true if the user has voted", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Voting Session", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await votingKlar.connect(user1).vote(0, 0);

      const hasVoted = await votingKlar.hasUserVoted(0, user1.address);
      expect(hasVoted).to.equal(true);
    });

    it("Should return false for a non-existent session", async function () {
      const { votingKlar, user1 } = await deployVotingFixture();

      await expect(
        votingKlar.hasUserVoted(1, user1.address)
      ).to.be.revertedWith("Session does not exist");
    });
  });

  describe("getSessionCreator", function () {
    it("Should return the correct session creator", async function () {
      const { votingKlar, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Test Session", startTime, endTime);

      const creator = await votingKlar.getSessionCreator(0);
      expect(creator).to.equal(owner.address);
    });

    it("Should revert if session does not exist", async function () {
      const { votingKlar } = await deployVotingFixture();

      await expect(
        votingKlar.getSessionCreator(1)
      ).to.be.revertedWith("Session does not exist");
    });

    it("Should return the creator even after the session is archived", async function () {
      const { votingKlar, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 2;

      await votingKlar.createVotingSession("Archived Session", startTime, endTime);

      await new Promise((resolve) => setTimeout(resolve, 3000));
      await votingKlar.archiveSession(0);

      const creator = await votingKlar.getSessionCreator(0);
      expect(creator).to.equal(owner.address);
    });
  });
  
  describe("getCandidates", function () {
    it("Should return an empty array if no candidates exist", async function () {
      const { votingKlar } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Empty Candidates", startTime, endTime);

      const candidates = await votingKlar.getCandidates(0);
      expect(candidates.length).to.equal(0);
    });

    it("Should return candidates correctly for a valid session", async function () {
      const { votingKlar } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Candidate Retrieval", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");
      await votingKlar.addCandidate(0, "Candidate B");

      const candidates = await votingKlar.getCandidates(0);
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Candidate A");
      expect(candidates[1].name).to.equal("Candidate B");
    });
  });

  // Additional test suites for functions like `getWinner`, `archiveSession`, etc.
  describe("archiveSession", function () {
    it("Should archive a session after its end time", async function () {
      const { votingKlar } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 2;

      await votingKlar.createVotingSession("Archive Test", startTime, endTime);

      // Wait for the session to end
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await votingKlar.archiveSession(0);

      const session = await votingKlar.votingSessions(0);
      expect(session.isActive).to.equal(false);
    });

    it("Should fail if session is still active", async function () {
      const { votingKlar } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Active Archive", startTime, endTime);

      await expect(votingKlar.archiveSession(0)).to.be.revertedWith(
        "Cannot archive active session"
      );
    });

    it("Should not affect candidate retrieval after archiving", async function () {
      const { votingKlar } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 2;

      await votingKlar.createVotingSession("Archive and Retrieve", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await votingKlar.archiveSession(0);

      const candidates = await votingKlar.getCandidates(0);
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Candidate A");
    });
  });

  describe("getWinner", function () {
    it("Should return the winner of the session", async function () {
      const { votingKlar, user1, user2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Winner Test", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");
      await votingKlar.addCandidate(0, "Candidate B");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingKlar.connect(user1).vote(0, 0);
      await votingKlar.connect(user2).vote(0, 0);

      const [winnerName, isTie] = await votingKlar.getWinner(0);
      expect(winnerName).to.equal("Candidate A");
      expect(isTie).to.equal(false);
    });

    it("Should return a tie if candidates have equal votes", async function () {
      const { votingKlar, user1, user2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Tie Test", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");
      await votingKlar.addCandidate(0, "Candidate B");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingKlar.connect(user1).vote(0, 0);
      await votingKlar.connect(user2).vote(0, 1);

      const [winnerName, isTie] = await votingKlar.getWinner(0);
      expect(winnerName).to.equal("");
      expect(isTie).to.equal(true);
    });

    it("Should return a tie when more than two candidates have the highest votes", async function () {
      const { votingKlar, user1, user2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Three-Way Tie", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");
      await votingKlar.addCandidate(0, "Candidate B");
      await votingKlar.addCandidate(0, "Candidate C");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingKlar.connect(user1).vote(0, 0); // Vote for Candidate A
      await votingKlar.connect(user2).vote(0, 1); // Vote for Candidate B

      // Simulate a third voter
      const [, , , user3] = await ethers.getSigners();
      await votingKlar.connect(user3).vote(0, 2); // Vote for Candidate C

      const [winnerName, isTie] = await votingKlar.getWinner(0);
      expect(winnerName).to.equal("");
      expect(isTie).to.equal(true);
    });

    it("Should revert if no candidates are in the session", async function () {
      const { votingKlar } = await deployVotingFixture();
    
      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;
    
      await votingKlar.createVotingSession("No Candidates", startTime, endTime);
    
      await expect(votingKlar.getWinner(0)).to.be.revertedWith(
        "No candidates in the session"
      );
    });    

    it("Should return no winner if all candidates have zero votes", async function () {
      const { votingKlar } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingKlar.createVotingSession("Zero Votes", startTime, endTime);
      await votingKlar.addCandidate(0, "Candidate A");
      await votingKlar.addCandidate(0, "Candidate B");

      const [winnerName, isTie] = await votingKlar.getWinner(0);
      expect(winnerName).to.equal("");
      expect(isTie).to.equal(true);
    });
  });
});
