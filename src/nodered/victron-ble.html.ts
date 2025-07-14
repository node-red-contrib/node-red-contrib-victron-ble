// Node-RED node editor logic for victron-ble
import { EditorRED } from "node-red";
declare var RED: EditorRED;

RED.nodes.registerType('victron-ble', {
    category: 'victron',
    color: '#4790d0',
    defaults: {
        name: { value: "" },
        address: { value: "", required: true },
        key: { value: "", type: "text" }
    },
    credentials:{
        key: { type: "text" }
    },
    inputs: 0,
    outputs: 1,
    icon: "victronenergy.svg",
    paletteLabel: "BLE",
    label: function(this: any) {
        return this.name || "BLE";
    },
    oneditprepare() {
        if ((this as any).credentials.has_key)
            $("#node-input-key").attr("placeholder", "**** Change existing Decryption Key ****");

        var $discoverBtn = $("#node-victron-ble-discover");
        $discoverBtn.on('click', () => {
            
            $.getJSON('victron-ble/discover', function(devices: any[]) {

                if (devices.length === 0) {
                    return;
                }

                const options_list: {value: string; label: string;}[] = [];

                devices.forEach(function(dev: any) {
                    options_list.push( {value: dev.address,  label: dev.name + ' (' + dev.address + ')'});
                });

                $("#node-input-address").typedInput({
                    types: [
                        {
                            value: "",
                            options: options_list
                        }
                    ]
                });
            });
        });
    },
    oneditsave() {
        const $inputKey = $('#node-input-key');
        if ($inputKey.val()=="")
            $inputKey.remove();
    }
}); 