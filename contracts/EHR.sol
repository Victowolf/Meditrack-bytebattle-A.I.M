// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Electronic Health Record (EHR) Smart Contract
/// @notice Stores authorized admin and doctor addresses and logs login events
contract EHR {
    // State variables
    address public admin;
    address public doctor;

    // Login event
    event LoginEvent(address indexed user, string role, uint timestamp);

    /// @notice Constructor sets authorized admin and doctor addresses
    /// @param _admin The Ethereum address of the admin
    /// @param _doctor The Ethereum address of the doctor
    constructor(address _admin, address _doctor) {
        admin = _admin;
        doctor = _doctor;
    }

    /// @notice Log login activity for admin or doctor
    /// @param role Role string, must be "admin" or "doctor"
    function logLogin(string memory role) external {
        bool isAdmin = (msg.sender == admin && keccak256(bytes(role)) == keccak256("admin"));
        bool isDoctor = (msg.sender == doctor && keccak256(bytes(role)) == keccak256("doctor"));

        require(isAdmin || isDoctor, "Unauthorized login");

        emit LoginEvent(msg.sender, role, block.timestamp);
    }
}
