import { Button, Divider, Input } from "antd";
import React, { useState } from "react";
import { utils } from "ethers";

import { Address, Balance, Events } from "../../components";

export default function Withdraw({
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

  const disableButton = () => {
    return address === undefined || address === null || address === "";
  };

  return (
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 20 }}>
        <div>
          <h4 style={{ float: "left" }}>Note</h4>
          <Input placeholder="Please enter your note" />
          <h4 style={{ float: "left" }}>Juicebox Project ID</h4>
          <Input placeholder="Please enter the ID of the project" />
          <Divider />
          <Button
            type="primary"
            block
            style={{ marginTop: 0 }}
            disabled={disableButton()}
            onClick={async () => {
              /* look how you call setPurpose on your contract: */
              /* notice how you pass a call back for tx updates too */
              const result = tx(writeContracts.YourContract.setPurpose("test"), update => {
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
              console.log(await result);
            }}
          >
            Fund Project
          </Button>
        </div>
      </div>
    </div>
  );
}
