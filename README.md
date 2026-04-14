# AMMB (All My Money Bags)

## Local-First Multi-Process Crypto Wallet Architecture Experiment

---

## Overview

AMMB is a research-driven exploration of how a cryptocurrency wallet can be constructed using strict process isolation, local execution boundaries, and controlled inter-process communication.

Rather than functioning as a typical consumer wallet or hosted application, this project is best understood as a systems architecture experiment spanning:

- browser-based execution environments
- extension-based messaging bridges
- Node.js orchestration layers
- local proxy-based blockchain access
- multi-chain transaction handling logic

The system was built to investigate how far a wallet can be decomposed into independently controlled components while maintaining deterministic, user-controlled signing behavior.

---

## Design Goals

This project was developed as an exploration of:

- Reducing exposure to external supply-chain dependencies
- Isolating execution contexts between dApp and wallet
- Enforcing explicit user-controlled authorization for signing actions
- Structuring blockchain interactions through a controlled proxy layer
- Understanding real-world constraints of multi-chain wallet design

The focus is not on commercial deployment, but on architecture, boundaries, and trust separation models.

---

## High-Level System Architecture

The system is composed of five primary components:

### 1. Local Wallet Runtime (Browser-based, file://)
- Runs entirely from local filesystem
- No CDN or remote script loading
- Stores and manages private keys locally
- Provides signing and transaction review UI

---

### 2. Browser Extension (Messaging Bridge)
- Acts as a controlled communication bridge between dApps and wallet
- Does not hold private keys
- Forwards structured requests to wallet runtime
- Enforces serialized request flow

---

### 3. dApp Execution Window
- Independent browser context used to load external dApps
- Communicates only through the extension bridge
- Cannot directly access wallet internals

---

### 4. Node.js RPC Proxy Layer
- Converts wallet requests into blockchain RPC calls
- Interfaces with external blockchain endpoints
- Provides abstraction across multiple chains and asset providers

---

### 5. Lifecycle Manager (Orchestrator)
- Boots the entire system in a controlled sequence
- Generates ephemeral session secrets for runtime coupling
- Spawns browser + proxy environments
- Ensures components are not independently reusable outside session context

---

## Communication Model

All interactions follow a strict serialized request pipeline:

- Only one active request is processed at a time
- Parallel request execution is explicitly disallowed
- All dApp-originated requests are routed through wallet UI for approval
- Signing operations require explicit user confirmation in wallet context

This enforces a deterministic interaction model between:

- untrusted external dApps
- wallet execution environment
- blockchain RPC layer

---

## Security and Trust Model (Experimental)

The system explores a set of isolation-based constraints:

- No CDN or dynamic third-party script loading
- Local-only execution of wallet code
- Extension-based mediation between trust boundaries
- Explicit approval required for:
  - connection initiation
  - network switching
  - transaction signing

The wallet is treated as the authoritative control layer rather than a passive key store.

It actively mediates and displays all incoming dApp requests before any action is taken.

---

## Supported Networks (Current Implementation)

- **EVM:** Ethereum, BSC, Polygon
- **Non-EVM:** Bitcoin, XRP, Stellar
- **Token Standards:** ERC20, BEP20

Network access is handled through configurable RPC asset provider definitions with runtime health tracking and error telemetry.

---

## Technical Notes

- Built using vanilla JavaScript (no frameworks)
- Uses Manifest V3 browser extension architecture
- Node.js-based orchestration and RPC proxy
- Modular network utilities per chain
- Custom messaging system for inter-process coordination

---

## What This Project Represents

This project is not intended as a production wallet or consumer tool.

It is a hands-on systems exploration of:

- browser security boundaries
- wallet–dApp interaction models
- multi-process orchestration
- trust separation in distributed UI systems
- practical constraints of crypto transaction pipelines

It also reflects a learning progression across:

- browser extension architecture
- inter-window / inter-tab messaging systems
- blockchain transaction flows
- Node.js service orchestration
- multi-chain integration patterns

---

## Key Takeaway

The core outcome of this project is not feature completeness, but insight into:

> how system design changes when every boundary is treated as potentially untrusted, and every interaction must be explicitly mediated.

---

## License

MIT (experimental / educational use)
