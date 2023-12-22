// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint public MAX_NFT_SUPPLY = 10000;
    uint256 public _tokenId;

    constructor() ERC721("Game", "GMT") {
    }

    function _baseURI() internal pure returns (string memory) {
        return "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/";
    }

    function mint() external {
        require(_tokenId >= 0 && _tokenId <= MAX_NFT_SUPPLY, "Token ID invalid");
        _mint(msg.sender, _tokenId);
        _tokenId++;
    }
}
// NFT合约地址
// https://goerli.etherscan.io/address/0xe81335d1a0d64f00b5d44df1fd132170e2f4ba29
