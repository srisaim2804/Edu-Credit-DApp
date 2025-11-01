# EduCredit DApp

EduCredit DApp is a decentralized application for managing and distributing educational credits. This application is built on the Ethereum blockchain and provides a transparent and secure way to handle student rewards and payments.

## Tech Stack

- **Frontend:**
  - [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
  - [Vite](https://vitejs.dev/) - A fast build tool for modern web development.
  - [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript.
  - [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
  - [Ethers.js](https://ethers.io/) - A complete Ethereum wallet implementation and utilities in JavaScript and TypeScript.

- **Backend (Smart Contract):**
  - [Solidity](https://soliditylang.org/) - The programming language for writing smart contracts on Ethereum.
  - [OpenZeppelin](https://www.openzeppelin.com/) - A library for secure smart contract development.

## Features

- **Admin Dashboard:**
  - Reward students with educational credits for various achievements (e.g., attendance, event participation, grades).
  - View a list of all registered students and their balances.
  - Track the history of all rewards given to students.

- **Student Dashboard:**
  - View their current balance of educational credits.
  - View a complete history of all rewards received from admin.
  - Transfer credits to the canteen for payments.

- **Canteen Dashboard:**
  - View the total credits received from students.
  - View a complete history of all payments received from students.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [MetaMask](https://metamask.io/) browser extension

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/edu-credit-dapp.git

   cd edu-credit-dapp
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Compile and deploy the smart contract:**

   - The smart contract is located in `contracts/erc_20.sol`.
   - You will need to compile and deploy the contract to your preferred Ethereum network (e.g., REMIX IDE).
   - Update the `CONTRACT_ADDRESS` in the all files. (How to get it check Youtube on how to use that IDE)

4. **Run the application:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`.