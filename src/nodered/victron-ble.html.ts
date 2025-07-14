// Node-RED node editor logic for victron-ble
import { EditorRED } from "node-red";
declare var RED: EditorRED;

RED.nodes.registerType('victron-ble', {
    category: 'victron',
    color: '#a6bbcf',
    defaults: {
        name: { value: "" },
        address: { value: "", required: true },
        key: { value: "", type: "text" }
    },
    inputs: 0,
    outputs: 1,
    icon: "font-awesome/fa-bluetooth",
    label: function(this: any) {
        return this.name || "victron-ble";
    },
    oneditprepare: function() {
        var $discoverBtn = $('<button type="button" class="red-ui-button">Discover Devices</button>');
        $discoverBtn.insertAfter("#node-input-address");
        $discoverBtn.on('click', () => {
            var $btn = $discoverBtn;
            $btn.prop('disabled', true).text('Scanning...');
            $.getJSON('victron-ble/discover', function(devices: any[]) {
                $btn.prop('disabled', false).text('Discover Devices');
                var $select = $('<select id="victron-device-select"></select>');
                $select.append('<option value="">Select a device</option>');
                devices.forEach(function(dev: any) {
                    $select.append('<option value="' + dev.address + '">' + dev.address + ' (' + dev.name + ')</option>');
                });
                $select.insertAfter($btn);
                $select.on('change', function(this: any) {
                    $('#node-input-address').val($(this).val());
                });
            }).fail(function() {
                $btn.prop('disabled', false).text('Discover Devices');
                alert('Device discovery failed');
            });
        });
    }
}); 