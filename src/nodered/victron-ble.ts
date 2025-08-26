import { NodeAPI, Node, NodeDef } from "node-red";
import * as path from "path";
import { Scanner } from "../scanner";

let scannerInstance: any = null;

module.exports = function(RED: NodeAPI) {
  function getScanner() {
    if (!scannerInstance) {
      scannerInstance = new Scanner();
      scannerInstance.start();
    }
    return scannerInstance;
  }

  RED.httpAdmin.get('/victron-ble/discover', function(req: any, res: any) {
    const scanner = getScanner();
    res.json(scanner.getDiscoveredDevices());
  });

  function VictronBleNode(this: Node, config: NodeDef & { address?: string; key?: string; includeRaw?: boolean }) {
    RED.nodes.createNode(this, config);
    const node = this;
    const address = (config.address || '').toLowerCase();
    const key = (this.credentials as any).key;
    const includeRaw = config.includeRaw || false;
    const scanner = getScanner();

    if (address && key) {
      scanner.setKey(address, key, includeRaw);
    }

    function onPacket(data: any) {
      if (data.address.toLowerCase() === address.toLocaleLowerCase()) {
        node.send(data);
      }
    }
    scanner.on('parsed', onPacket);

    node.on('close', function() {
      // unregister listener when node stops
      scanner.removeListener('parsed', onPacket);
    });
  }

  RED.nodes.registerType('victron-ble', VictronBleNode ,{ credentials: { key: { type: "password" }}} );
}; 
