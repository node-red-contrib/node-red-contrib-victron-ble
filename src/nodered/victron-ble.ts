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

  function VictronBleNode(this: Node, config: NodeDef & { address?: string; key?: string }) {
    RED.nodes.createNode(this, config);
    const node = this;
    const address = (config.address || '').toLowerCase();
    const key = (this.credentials as any).key;
    const scanner = getScanner();

    if (address && key) {
      scanner.setKey(address, key);
    }

    function onPacket(data: any) {
      if (data.address.toLowerCase() === address.toLocaleLowerCase()) {
        node.send({ payload: data.payload, address: data.address, name: data.name, rssi: data.rssi, lastSeen: data.lastSeen });
      }
    }
    scanner.on('parsed', onPacket);

    node.on('close', function() {
      scanner.emitter.removeListener('packet', onPacket);
    });
  }

  RED.nodes.registerType('victron-ble', VictronBleNode ,{ credentials: { key: { type: "password" }}} );
}; 