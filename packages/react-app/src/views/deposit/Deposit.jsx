import { Button, Divider, Input, Radio  } from "antd";
import React, { useState } from "react";
import { utils } from "ethers";

import { Address, Balance, Events } from "../../components";

// import { getCommitment } from "./zk-helper";

export default function Deposit({
  purpose,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {

  const [ethValue, setETHValue] = useState(1);

  const onChange = (e) => {
    console.log('radio checked', e.target.value);
    setETHValue(e.target.value);
  };

  const disableButton = () => {
    return address === undefined || address === null || address === "";
  };

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 20 }}>
        <h2>Please select ETH Amount</h2>
        <div>
          <Radio.Group onChange={onChange} value={ethValue}>
            <Radio value={0.1}>0.1 ETH</Radio>
            <Radio value={1}>1 ETH</Radio>
            <Radio value={10}>10 ETH</Radio>
            <Radio value={100}>100 ETH</Radio>
          </Radio.Group>
          <Divider />
          <Button
            type="primary"
            block
            disabled={disableButton()}
            style={{ marginTop: 0}}
            onClick={async () => {
              /* look how you call setPurpose on your contract: */
              /* notice how you pass a call back for tx updates too */
             /*  const result = tx(writeContracts.YourContract.deposit(getCommitment()), update => {
                console.log("📡 Transaction Update:", update);
                if (update && (update.status === "confirmed" || update.status === 1)) {
                  console.log(" 🍾 Transaction " + update.hash + " finished!");
                  console.log(
                    " ⛽️ " +
                      update.gasUsed +
                      "/" +
                      (update.gasLimit || update.gas) +
                      " @ " +
                      parseFloat(update.gasPrice) / 1000000000 +
                      " gwei",
                  );
                }
              });
              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result); */
            }}
          >
            Anonymize!
          </Button>
        </div>
        <Divider />
      </div>
    </div>
  );
}
