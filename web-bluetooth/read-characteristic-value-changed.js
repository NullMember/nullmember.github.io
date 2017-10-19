var bluetoothDevice;
var valueandtimeCharacteristic;

function onReadBatteryLevelButtonClick() {
  return (bluetoothDevice ? Promise.resolve() : requestDevice())
  .then(connectDeviceAndCacheCharacteristics)
  .then(_ => {
    log('Reading Value and Time...');
    return valueandtimeCharacteristic.readValue();
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function requestDevice() {
  log('Requesting any Bluetooth Device...');
  return navigator.bluetooth.requestDevice({
   // filters: [...] <- Prefer filters to save energy & show relevant devices.
      acceptAllDevices: true,
      optionalServices: ['user_data']})
  .then(device => {
    bluetoothDevice = device;
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
  });
}

function connectDeviceAndCacheCharacteristics() {
  if (bluetoothDevice.gatt.connected && valueandtimeCharacteristic) {
    return Promise.resolve();
  }

  log('Connecting to GATT Server...');
  return bluetoothDevice.gatt.connect()
  .then(server => {
    log('Getting User Data Service...');
    return server.getPrimaryService('user_data');
  })
  .then(service => {
    log('Getting Value and Time Characteristic...');
    return service.getCharacteristic(0x0001);
  })
  .then(characteristic => {
    valueandtimeCharacteristic = characteristic;
    valueandtimeCharacteristic.addEventListener('characteristicvaluechanged',
        handleBatteryLevelChanged);
    document.querySelector('#startNotifications').disabled = false;
    document.querySelector('#stopNotifications').disabled = true;
  });
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
function handleBatteryLevelChanged(event) {
  let batteryLevel = event.target.value.getUint8(0);
  log('> Battery Level is ' + batteryLevel + '%');
}

function onStartNotificationsButtonClick() {
  log('Starting Battery Level Notifications...');
  valueandtimeCharacteristic.startNotifications()
  .then(_ => {
    log('> Notifications started');
    document.querySelector('#startNotifications').disabled = true;
    document.querySelector('#stopNotifications').disabled = false;
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function onStopNotificationsButtonClick() {
  log('Stopping Battery Level Notifications...');
  valueandtimeCharacteristic.stopNotifications()
  .then(_ => {
    log('> Notifications stopped');
    document.querySelector('#startNotifications').disabled = false;
    document.querySelector('#stopNotifications').disabled = true;
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function onResetButtonClick() {
  if (valueandtimeCharacteristic) {
    valueandtimeCharacteristic.removeEventListener('characteristicvaluechanged',
        handleBatteryLevelChanged);
    valueandtimeCharacteristic = null;
  }
  // Note that it doesn't disconnect device.
  bluetoothDevice = null;
  log('> Bluetooth Device reset');
}

function onDisconnected() {
  log('> Bluetooth Device disconnected');
  connectDeviceAndCacheCharacteristics()
  .catch(error => {
    log('Argh! ' + error);
  });
}
