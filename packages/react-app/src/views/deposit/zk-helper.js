const snarkjs = require("snarkjs");
const crypto = require("crypto");
const circomlib = require("circomlib");
const bigInt = snarkjs.bigInt;
const merkleTree = require("fixed-merkle-tree");
const buildGroth16 = require("websnark/src/groth16");
const websnarkUtils = require("websnark/src/utils");
const { toWei, fromWei, toBN, BN } = require("web3-utils");
const assert = require("assert");

let tornado, circuit, proving_key, groth16;
let MERKLE_TREE_HEIGHT = 20;

/** Generate random number of specified byte length */
const rbigint = nbytes => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes));

/** Compute pedersen hash */
const pedersenHash = data => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];

/** BigNumber to hex string of specified length */
function toHex(number, length = 32) {
  const str = number instanceof Buffer ? number.toString("hex") : bigInt(number).toString(16);
  return "0x" + str.padStart(length * 2, "0");
}

/**
 * Create deposit object from secret and nullifier
 */
function createDeposit({ nullifier, secret }) {
  const deposit = { nullifier, secret };
  deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)]);
  deposit.commitment = pedersenHash(deposit.preimage);
  deposit.commitmentHex = toHex(deposit.commitment);
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31));
  deposit.nullifierHex = toHex(deposit.nullifierHash);
  return deposit;
}

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the tornado, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */
async function generateMerkleProof(deposit) {
  // Get all deposit events from smart contract and assemble merkle tree from them
  console.log("Getting current state from tornado contract");
  const events = await tornado.getPastEvents("Deposit", { fromBlock: 0, toBlock: "latest" });
  const leaves = events
    .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
    .map(e => e.returnValues.commitment);
  const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves);

  // Find current commitment in the tree
  const depositEvent = events.find(e => e.returnValues.commitment === toHex(deposit.commitment));
  const leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1;

  // Validate that our data is correct
  const root = tree.root();
  const isValidRoot = await tornado.methods.isKnownRoot(toHex(root)).call();
  const isSpent = await tornado.methods.isSpent(toHex(deposit.nullifierHash)).call();
  assert(isValidRoot === true, "Merkle tree is corrupted");
  assert(isSpent === false, "The note is already spent");
  assert(leafIndex >= 0, "The deposit is not found in the tree");

  // Compute merkle proof of our commitment
  const { pathElements, pathIndices } = tree.path(leafIndex);
  return { pathElements, pathIndices, root: tree.root() };
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateProof({ deposit, recipient, relayerAddress = 0, fee = 0, refund = 0 }) {
  // Compute merkle proof of our commitment
  const { root, pathElements, pathIndices } = await generateMerkleProof(deposit);

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: bigInt(relayerAddress),
    fee: bigInt(fee),
    refund: bigInt(refund),

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: pathElements,
    pathIndices: pathIndices,
  };

  console.log("Generating SNARK proof");
  console.time("Proof time");
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key);
  const { proof } = websnarkUtils.toSolidityInput(proofData);
  console.timeEnd("Proof time");

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund),
  ];

  return { proof, args };
}

export const getCommitment = () => {
  const deposit = createDeposit({ nullifier: rbigint(31), secret: rbigint(31) });

  return toHex(deposit.commitment);
};
