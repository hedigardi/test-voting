import { expect } from "chai";
import { ethers } from "hardhat";

describe("Voting Contract", function () {
    it("Should add candidates and allow voting", async function () {
        const Voting = await ethers.getContractFactory("Voting");
        const voting = await Voting.deploy();
        await voting.waitForDeployment();

        await voting.addCandidate("Alice");
        await voting.addCandidate("Bob");

        const candidate = await voting.getCandidate(0);
        expect(candidate[0]).to.equal("Alice");

        await voting.vote(0);
        const updatedCandidate = await voting.getCandidate(0);
        expect(updatedCandidate[1]).to.equal(1);
    });
    it("Should prevent double voting", async function () {
        const Voting = await ethers.getContractFactory("Voting");
        const voting = await Voting.deploy();
        await voting.waitForDeployment();

        await voting.addCandidate("Alice");
        await voting.vote(0);

        await expect(voting.vote(0)).to.be.revertedWith("Already voted.");
    });
});
