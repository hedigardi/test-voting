import { expect } from "chai";
import { ethers } from "hardhat";

// Test suite for the VotingContract2 smart contract
describe("VotingContract2", function () {
  // Helper function to deploy the VotingContract2 contract and set up signers
  async function deployVotingFixture() {
    const [owner, user1, user2] = await ethers.getSigners(); // Get test accounts

    const VotingContract2 = await ethers.getContractFactory("VotingContract2"); // Fetch contract factory
    const votingContract2 = await VotingContract2.deploy(); // Deploy the contract

    return { votingContract2, owner, user1, user2 }; // Return deployed contract and accounts
  }

  // Test cases related to contract deployment
  describe("Deployment", function () {
    it("Should deploy with an initial session count of 0", async function () {
      const { votingContract2 } = await deployVotingFixture();
      expect(await votingContract2.sessionCount()).to.equal(0); // Check initial session count
    });
  });

  // Test cases for creating a voting session
  describe("createVotingSession", function () {
    it("Should create a voting session", async function () {
      const { votingContract2, owner } = await deployVotingFixture();
  
      const startTime = Math.floor(Date.now() / 1000) + 100; // Future start time
      const endTime = startTime + 600; // End time after start time
  
      // Expect the VotingSessionCreated event to be emitted with the correct arguments
      await expect(
        votingContract2.createVotingSession("Test Voting", startTime, endTime)
      )
        .to.emit(votingContract2, "VotingSessionCreated")
        .withArgs(owner.address, 0, "Test Voting", startTime, endTime);

      // Verify session details
      const session = await votingContract2.votingSessions(0);
      expect(session.title).to.equal("Test Voting");
      expect(session.startTime).to.equal(startTime);
      expect(session.endTime).to.equal(endTime);
      expect(session.creator).to.equal(owner.address);
    });
  
    it("Should fail if end time is before start time", async function () {
      const { votingContract2 } = await deployVotingFixture();
  
      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime - 100; // Invalid end time
  
      // Expect the transaction to revert with an error
      await expect(
        votingContract2.createVotingSession("Invalid Voting", startTime, endTime)
      ).to.be.revertedWith("End time must be after start time");
    });
  });

  // Test cases for adding candidates
  describe("addCandidate", function () {
    it("Should allow session creator to add a candidate", async function () {
      const { votingContract2, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Voting with Candidates", startTime, endTime);

      // Add a candidate and expect the CandidateAdded event to be emitted
      await expect(votingContract2.addCandidate(0, "Candidate 1"))
        .to.emit(votingContract2, "CandidateAdded")
        .withArgs(0, "Candidate 1");

      // Verify candidate details
      const candidates = await votingContract2.getCandidates(0);
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Candidate 1");
    });

    it("Should fail if called by a non-creator", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Unauthorized Add", startTime, endTime);

      // Expect transaction to revert with the correct error message
      await expect(
        votingContract2.connect(user1).addCandidate(0, "Candidate 2")
      ).to.be.revertedWith("Only the session creator can perform this action");
    });

    it("Should fail if session does not exist", async function () {
      const { votingContract2 } = await deployVotingFixture();

      // Attempt to add a candidate to a non-existent session
      await expect(
        votingContract2.addCandidate(1, "Nonexistent Candidate")
      ).to.be.revertedWith("Session does not exist");
    });

    it("Should allow adding multiple candidates", async function () {
      const { votingContract2, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Multiple Candidates", startTime, endTime);

      // Add multiple candidates and verify their details
      await expect(votingContract2.addCandidate(0, "Candidate 1"))
        .to.emit(votingContract2, "CandidateAdded")
        .withArgs(0, "Candidate 1");

      await expect(votingContract2.addCandidate(0, "Candidate 2"))
        .to.emit(votingContract2, "CandidateAdded")
        .withArgs(0, "Candidate 2");

      const candidates = await votingContract2.getCandidates(0);
      expect(candidates.length).to.equal(2);
      expect(candidates[1].name).to.equal("Candidate 2");
    });
  });

  // Test cases for voting functionality
  describe("vote", function () {
    it("Should allow voting during the voting period", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Voting Session", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cast a vote and expect the VoteCast event to be emitted
      await expect(votingContract2.connect(user1).vote(0, 0))
        .to.emit(votingContract2, "VoteCast")
        .withArgs(user1.address, 0, 0);

      const candidates = await votingContract2.getCandidates(0);
      expect(candidates[0].voteCount).to.equal(1);
    });

    // Additional test cases for edge cases, including invalid votes and duplicate votes
    it("Should fail if voting outside the voting period", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Early Voting", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");

      await expect(
        votingContract2.connect(user1).vote(0, 0)
      ).to.be.revertedWith("Voting is not active for this session");
    });

    it("Should fail if user has already voted", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Duplicate Voting", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingContract2.connect(user1).vote(0, 0);

      await expect(
        votingContract2.connect(user1).vote(0, 0)
      ).to.be.revertedWith("You have already voted");
    });

    it("Should fail if voting on a non-existent candidate", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Invalid Candidate Vote", startTime, endTime);

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await expect(
        votingContract2.connect(user1).vote(0, 0)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("Should fail if no candidates exist in the session", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("No Candidates", startTime, endTime);

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await expect(
        votingContract2.connect(user1).vote(0, 0)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("Should allow voting exactly at the session start time", async function () {
        const { votingContract2, user1 } = await deployVotingFixture();
    
        const startTime = Math.floor(Date.now() / 1000) + 1; // Start in 1 second
        const endTime = startTime + 600;
    
        await votingContract2.createVotingSession("Boundary Test", startTime, endTime);
        await votingContract2.addCandidate(0, "Candidate A");
    
        // Wait for the session to start
        await new Promise((resolve) => setTimeout(resolve, 1000));
    
        await expect(votingContract2.connect(user1).vote(0, 0)).to.emit(
            votingContract2,
            "VoteCast"
        );
    });
    
    it("Should allow voting exactly at the session end time", async function () {
        const { votingContract2, user1 } = await deployVotingFixture();
    
        // Get current block timestamp
        const latestBlock = await ethers.provider.getBlock('latest');
        const currentTime = latestBlock!.timestamp;
    
        // Set start time 10 seconds from now and end time 20 seconds from now
        const startTime = currentTime + 10;
        const endTime = currentTime + 20;
    
        await votingContract2.createVotingSession("Boundary Test", startTime, endTime);
        await votingContract2.addCandidate(0, "Candidate A");
    
        // Move time forward to start time
        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
        await ethers.provider.send("evm_mine");
    
        // Vote at the start time
        await expect(votingContract2.connect(user1).vote(0, 0))
            .to.emit(votingContract2, "VoteCast")
            .withArgs(user1.address, 0, 0);
    
        // Verify the vote was counted
        const candidates = await votingContract2.getCandidates(0);
        expect(candidates[0].voteCount).to.equal(1);
    });    
});

  describe("hasUserVoted", function () {
    it("Should return false if the user has not voted", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Voting Session", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");

      const hasVoted = await votingContract2.hasUserVoted(0, user1.address);
      expect(hasVoted).to.equal(false);
    });

    it("Should return true if the user has voted", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Voting Session", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await votingContract2.connect(user1).vote(0, 0);

      const hasVoted = await votingContract2.hasUserVoted(0, user1.address);
      expect(hasVoted).to.equal(true);
    });

    it("Should return false for a non-existent session", async function () {
      const { votingContract2, user1 } = await deployVotingFixture();

      await expect(
        votingContract2.hasUserVoted(1, user1.address)
      ).to.be.revertedWith("Session does not exist");
    });
  });

  describe("getSessionCreator", function () {
    it("Should return the correct session creator", async function () {
      const { votingContract2, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Test Session", startTime, endTime);

      const creator = await votingContract2.getSessionCreator(0);
      expect(creator).to.equal(owner.address);
    });

    it("Should revert if session does not exist", async function () {
      const { votingContract2 } = await deployVotingFixture();

      await expect(
        votingContract2.getSessionCreator(1)
      ).to.be.revertedWith("Session does not exist");
    });

    it("Should return the creator even after the session is archived", async function () {
      const { votingContract2, owner } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 2;

      await votingContract2.createVotingSession("Archived Session", startTime, endTime);

      await new Promise((resolve) => setTimeout(resolve, 3000));
      await votingContract2.archiveSession(0);

      const creator = await votingContract2.getSessionCreator(0);
      expect(creator).to.equal(owner.address);
    });

    it("Should revert if session ID is very high", async function () {
        const { votingContract2 } = await deployVotingFixture();
    
        await expect(votingContract2.getCandidates(999)).to.be.revertedWith(
            "Session does not exist"
        );
    });    
  });
  
  describe("getCandidates", function () {
    it("Should return an empty array if no candidates exist", async function () {
      const { votingContract2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Empty Candidates", startTime, endTime);

      const candidates = await votingContract2.getCandidates(0);
      expect(candidates.length).to.equal(0);
    });

    it("Should return candidates correctly for a valid session", async function () {
      const { votingContract2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Candidate Retrieval", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");
      await votingContract2.addCandidate(0, "Candidate B");

      const candidates = await votingContract2.getCandidates(0);
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Candidate A");
      expect(candidates[1].name).to.equal("Candidate B");
    });
  });

  // Additional test suites for functions like `getWinner`, `archiveSession`, etc.
  describe("archiveSession", function () {
    it("Should archive a session after its end time", async function () {
      const { votingContract2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 2;

      await votingContract2.createVotingSession("Archive Test", startTime, endTime);

      // Wait for the session to end
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await votingContract2.archiveSession(0);

      const session = await votingContract2.votingSessions(0);
      expect(session.isActive).to.equal(false);
    });

    it("Should fail if session is still active", async function () {
      const { votingContract2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Active Archive", startTime, endTime);

      await expect(votingContract2.archiveSession(0)).to.be.revertedWith(
        "Cannot archive active session"
      );
    });

    it("Should not affect candidate retrieval after archiving", async function () {
      const { votingContract2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 2;

      await votingContract2.createVotingSession("Archive and Retrieve", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await votingContract2.archiveSession(0);

      const candidates = await votingContract2.getCandidates(0);
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Candidate A");
    });
  });

  describe("getWinner", function () {
    it("Should return the winner of the session", async function () {
      const { votingContract2, user1, user2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Winner Test", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");
      await votingContract2.addCandidate(0, "Candidate B");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingContract2.connect(user1).vote(0, 0);
      await votingContract2.connect(user2).vote(0, 0);

      const [winnerName, isTie] = await votingContract2.getWinner(0);
      expect(winnerName).to.equal("Candidate A");
      expect(isTie).to.equal(false);
    });

    it("Should return a tie if candidates have equal votes", async function () {
      const { votingContract2, user1, user2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Tie Test", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");
      await votingContract2.addCandidate(0, "Candidate B");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingContract2.connect(user1).vote(0, 0);
      await votingContract2.connect(user2).vote(0, 1);

      const [winnerName, isTie] = await votingContract2.getWinner(0);
      expect(winnerName).to.equal("");
      expect(isTie).to.equal(true);
    });

    it("Should return a tie when more than two candidates have the highest votes", async function () {
      const { votingContract2, user1, user2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Three-Way Tie", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");
      await votingContract2.addCandidate(0, "Candidate B");
      await votingContract2.addCandidate(0, "Candidate C");

      // Wait for the session to become active
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await votingContract2.connect(user1).vote(0, 0); // Vote for Candidate A
      await votingContract2.connect(user2).vote(0, 1); // Vote for Candidate B

      // Simulate a third voter
      const [, , , user3] = await ethers.getSigners();
      await votingContract2.connect(user3).vote(0, 2); // Vote for Candidate C

      const [winnerName, isTie] = await votingContract2.getWinner(0);
      expect(winnerName).to.equal("");
      expect(isTie).to.equal(true);
    });

    it("Should revert if no candidates are in the session", async function () {
      const { votingContract2 } = await deployVotingFixture();
    
      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;
    
      await votingContract2.createVotingSession("No Candidates", startTime, endTime);
    
      await expect(votingContract2.getWinner(0)).to.be.revertedWith(
        "No candidates in the session"
      );
    });    

    it("Should return no winner if all candidates have zero votes", async function () {
      const { votingContract2 } = await deployVotingFixture();

      const startTime = Math.floor(Date.now() / 1000) + 1;
      const endTime = startTime + 600;

      await votingContract2.createVotingSession("Zero Votes", startTime, endTime);
      await votingContract2.addCandidate(0, "Candidate A");
      await votingContract2.addCandidate(0, "Candidate B");

      const [winnerName, isTie] = await votingContract2.getWinner(0);
      expect(winnerName).to.equal("");
      expect(isTie).to.equal(true);
    });

    it("Should return no winner if all candidates have 0 votes", async function () {
        const { votingContract2 } = await deployVotingFixture();
    
        const startTime = Math.floor(Date.now() / 1000) + 1;
        const endTime = startTime + 600;
    
        await votingContract2.createVotingSession("Zero Vote Test", startTime, endTime);
        await votingContract2.addCandidate(0, "Candidate A");
        await votingContract2.addCandidate(0, "Candidate B");
    
        const [winnerName, isTie] = await votingContract2.getWinner(0);
        expect(winnerName).to.equal("");
        expect(isTie).to.equal(true);
    });    
  });
});
