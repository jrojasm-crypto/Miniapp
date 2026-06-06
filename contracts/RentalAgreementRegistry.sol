// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RentalAgreementRegistry {
    enum SignatureRole {
        Resident,
        Landlord
    }

    struct Agreement {
        bytes32 contractHash;
        bytes32 propertyHash;
        address resident;
        address landlord;
        bool residentSigned;
        bool landlordSigned;
        uint256 createdAt;
        uint256 residentSignedAt;
        uint256 landlordSignedAt;
    }

    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;

    event AgreementCreated(
        uint256 indexed agreementId,
        bytes32 indexed contractHash,
        bytes32 indexed propertyHash,
        address resident,
        address landlord
    );

    event AgreementSigned(
        uint256 indexed agreementId,
        SignatureRole indexed role,
        address indexed signer,
        uint256 signedAt
    );

    error InvalidParty();
    error AgreementNotFound();
    error UnauthorizedSigner();
    error AlreadySigned();

    function createAgreement(
        bytes32 contractHash,
        bytes32 propertyHash,
        address resident,
        address landlord
    ) external returns (uint256 agreementId) {
        if (resident == address(0) || landlord == address(0) || resident == landlord) {
            revert InvalidParty();
        }

        agreementId = ++agreementCount;
        agreements[agreementId] = Agreement({
            contractHash: contractHash,
            propertyHash: propertyHash,
            resident: resident,
            landlord: landlord,
            residentSigned: false,
            landlordSigned: false,
            createdAt: block.timestamp,
            residentSignedAt: 0,
            landlordSignedAt: 0
        });

        emit AgreementCreated(agreementId, contractHash, propertyHash, resident, landlord);
    }

    function signAsResident(uint256 agreementId) external {
        Agreement storage agreement = _agreement(agreementId);
        if (msg.sender != agreement.resident) revert UnauthorizedSigner();
        if (agreement.residentSigned) revert AlreadySigned();

        agreement.residentSigned = true;
        agreement.residentSignedAt = block.timestamp;

        emit AgreementSigned(agreementId, SignatureRole.Resident, msg.sender, block.timestamp);
    }

    function signAsLandlord(uint256 agreementId) external {
        Agreement storage agreement = _agreement(agreementId);
        if (msg.sender != agreement.landlord) revert UnauthorizedSigner();
        if (agreement.landlordSigned) revert AlreadySigned();

        agreement.landlordSigned = true;
        agreement.landlordSignedAt = block.timestamp;

        emit AgreementSigned(agreementId, SignatureRole.Landlord, msg.sender, block.timestamp);
    }

    function isComplete(uint256 agreementId) external view returns (bool) {
        Agreement storage agreement = _agreement(agreementId);
        return agreement.residentSigned && agreement.landlordSigned;
    }

    function _agreement(uint256 agreementId) private view returns (Agreement storage agreement) {
        agreement = agreements[agreementId];
        if (agreement.createdAt == 0) revert AgreementNotFound();
    }
}
