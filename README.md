# Voting DApp

A decentralized application (dApp) for conducting transparent and efficient voting processes on the Ethereum blockchain.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Usage Guidelines](#usage-guidelines)
  - [Admin Panel](#admin-panel)
  - [Voting Page](#voting-page)
  - [Results Page](#results-page)
- [Smart Contract Overview](#smart-contract-overview)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Voting DApp is a blockchain-based decentralized application that facilitates secure and transparent voting processes. The application supports the creation of voting sessions, allows participants to vote, and displays results after voting concludes.

---

## Features

- **Admin Features**:
  - Create voting sessions with start and end times.
  - Add candidates to voting sessions.
  - Archive completed voting sessions.

- **User Features**:
  - View active and upcoming voting sessions.
  - Cast votes for candidates during voting periods.
  - View voting results, including winners or ties.

- **Smart Contract**:
  - Ensures transparency and immutability.
  - Prevents duplicate voting and restricts access to authorized actions.

---

## Technologies Used

- **Frontend**: React, Bootstrap
- **Blockchain**: Solidity, Hardhat
- **Testing**: Mocha, Chai
- **Network**: Sepolia Ethereum Testnet
- **Storage**: Alchemy API

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) browser extension
- [Hardhat](https://hardhat.org/) development environment

---

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
