# Serial API Explainer

This document is an explainer for the [Serial API](http://wicg.github.io/serial/), a proposed specification for allowing a web page to communicate with a serial device.

## Motivation

Users, especially in the educational, hobbyist and industrial sectors, connect peripheral devices to their computers that require custom software to control. For example, robotics are often used to teach computer programming and electronics in schools. This requires software which can upload code to a robot and/or control it remotely. In an industrial or hobbyist setting a piece of equipment such as a mill, laser cutter or 3D printer is controlled by a program running on a connected computer. These devices are often controlled by small microcontrollers via a serial connection.

There are many examples of this control software being built using web technology. For example,

* [Arduino Create](https://create.arduino.cc/)
* [Betaflight Configurator](https://github.com/betaflight/betaflight-configurator)
* [Espruino IDE](http://espruino.com/ide)
* [MakeCode](https://www.microsoft.com/en-us/makecode)

In some cases these web sites communicate with the device through a native agent application that is manually installed by the user. In others the application is delivered in a packaged native application through a framework such as Electron. In others the user is required to perform an additional step such as copying a compiled application to the device via a USB flash drive.

In all these cases the user experience would be improved by providing direct communication between the site and the device that it is controlling. For sites that require installation of a native component this will also improve user security and privacy by limiting the scope of powerful capabilities granted to the site author in order to perform the task.

### Why not Web Bluetooth or WebUSB?

The Web Bluetooth and WebUSB APIs provide low level access to Bluetooth Low Energy and USB peripherals. If most devices with a serial interface are Bluetooth or USB why do we need a separate API?

1. Not all serial devices are Bluetooth or USB devices. Some platforms still include a built-in UART providing a serial interface either as a DE-9 connector (most PC platforms) or as headers on the system board (for example, the Raspberry Pi).

2. Most operating systems require applications (including user agents) to interact with devices using the highest-level API available. For example, if a USB device implements the standard USB CDC-ACM interface class then a built-in class driver will claim that interface and provide a virtual serial port interface. Because the USB interface has been claimed an implementation of the WebUSB API cannot claim it instead. The device must be accessed through the system's serial port API.

## Potential API

Before a site can connect to a serial device it must request access. If a site only supports communciating with a subset of all potential devices then it can provide a filter which will limit the set of selectable devices to those matching certain properties such as a USB vendor ID.

```javascript
const filter = {
  usbVendorId: 0x2341 // Arduino SA
};

try {
  const port = await navigator.serial.requestPort({filters: [filter]});
  // Continue connecting to |port|.
} catch (e) {
  // Permission to access a device was denied implicitly or explicitly by the user.
}
```

With access to a `SerialPort` instance the site may now open a connection to the port. Most parameters to `open()` are optional however the baud rate is required as there is no sensible default. You as the developer must know the rate at which your device expects to communicate.

```javascript
await port.open({ baudrate: /* pick your baud rate */ });
```

At this point the `readable` and `writable` attributes are populated with a [`ReadableStream`](https://streams.spec.whatwg.org/#rs-class) and [`WritableStream`](https://streams.spec.whatwg.org/#ws-class) that can be used to receive data from and send data to the connected device.

In this example we assume a device implementing a protocol inspired by the [Hayes command set](https://en.wikipedia.org/wiki/Hayes_command_set). Since commands are encoded in ASCII a [`TextEncoder`](https://encoding.spec.whatwg.org/#interface-textencoder) and [`TextDecoder`](https://encoding.spec.whatwg.org/#interface-textdecoder) are used to translate the `Uint8Array`s used by the `SerialPort`'s streams to and from strings.

```javascript
const encoder = new TextEncoder();
const writer = encoder.writable.getWriter();
writer.write(encoder.encode("AT"));

const decoder = new TextDecoder();
const reader = port.readable.getReader();
const { value, done } = await reader.read();
console.log(decoder.decode(value));
// Expected output: OK
```

The readable and writable streams must be unlocked before the port can be closed.

```javascript
writer.releaseLock();
reader.releaseLock();
await port.close();
```

Rather than reading a single chunk from the stream code will often read continuously using a loop like this,

```javascript
const reader = port.readable.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) {
    // |reader| has been canceled.
    break;
  }
  // Do something with |value|...
}
reader.releaseLock();
```

In this case `port.readable` will not be unlocked until the stream encounters an error, so how do you close the port? Calling `cancel()` on `reader` will cause the `Promise` returned by `read()` to resolve immediately with `{ value: undefined, done: true }`. This will cause the code above to break out of the loop and unlock the stream so that the port can be closed,

```javascript
await reader.cancel();
await port.close();
```

A serial port may generate one of a number of non-fatal read errors for conditions such as buffer overflow, framing or parity errors. These are thrown as exceptions from the `read()` method and cause the `ReadableStream` to become errored. If the error is non-fatal then `port.readable` is immediately replaced by a new `ReadableStream` that picks up right after the error. To expand the example above to handle these errors another loop is added,

```javascript
while (port.readable) {
  const reader = port.readable.getReader();
  while (true) {
    let value, done;
    try {
      ({ value, done } = await reader.read());
    } catch (error) {
      // Handle |error|...
      break;
    }
    if (done) {
      // |reader| has been canceled.
      break;
    }
    // Do something with |value|...
  }
  reader.releaseLock();
}
```

If a fatal error occurs, such as a USB device being removed, then `port.readable` will be set to `null`.

Revisiting the earlier example, for a device that always produces ASCII text the explicit calls to `encode()` and `decode()` can be removed through the use of [`TransformStream`](https://streams.spec.whatwg.org/#ts)s. In this example `writer` comes from a [`TextEncoderStream`](https://encoding.spec.whatwg.org/#interface-textencoderstream) and `reader` comes from a [`TextDecoderStream`](https://encoding.spec.whatwg.org/#interface-textdecoderstream). The `pipeTo()` method is used to connect these transforms to the port.

```javascript
const encoder = new TextEncoderStream();
const writableStreamClosed = encoder.readable.pipeTo(port.writable);
const writer = encoder.writable.getWriter();
writer.write("AT");

const decoder = new TextDecoderStream();
const readableStreamClosed = port.readable.pipeTo(decoder.writable);
const reader = decoder.readable.getReader();
const { value, done } = await reader.read();
console.log(value);
// Expected output: OK
```

When piping through a transform stream closing the port becomes more complicated. Closing `reader` or `writer` will cause an error to propagate through the transform streams to the underlying port. However, this propagation doesn't happen immediately. The new `writableStreamClosed` and `readableStreamClosed` promises are required to detect when `port.readable` and `port.writable` have been unlocked. Since canceling `reader` causes the stream to be aborted the resulting error must be caught and ignored,

```javascript
writer.close();
await writableStreamClosed;
reader.cancel();
await readableStreamClosed.catch(reason => {});
await port.close();
```

Serial ports include a number of additional signals for device detection and flow control which can be queried and set explicitly. As an example, some devices like the Arduino will enter a programming mode if the [Data Terminal Ready](https://en.wikipedia.org/wiki/Data_Terminal_Ready) (DTR) signal is toggled.

```javascript
await port.setSignal({ dtr: false });
await new Promise(resolve => setTimeout(200, resolve));
await port.setSignal({ dtr: true });
```

If a serial port is provided by a USB device then that device may be connected or disconnected from the system. Once a site has permission to access a port it can receive these events and query for the set of connected devices it currently has access to.

```javascript
// Check to see what ports are available when the page loads.
document.addEventListener('DOMContentLoaded', async () => {
  let ports = await navigator.serial.getPorts();
  // Populate the UI with options for the user to select or automatically
  // connect to devices.
});

navigator.serial.addEventListener('connect', e => {
  // Add |e.port| to the UI or automatically connect.
});

navigator.serial.addEventListener('disconnect', e => {
  // Remove |e.port| from the UI. If the device was open the disconnection can
  // also be observed as a stream error.
});
```

### WebIDL

```javascript
[Exposed=Window, SecureContext]
partial interface Navigator {
  [SameObject] readonly attribute Serial serial;
};

[Exposed=DedicatedWorker, SecureContext]
partial interface WorkerNavigator {
  [SameObject] readonly attribute Serial serial;
};

dictionary SerialConnectionEventInit {
  required SerialPort port;
};

[Exposed=(DedicatedWorker,Window), SecureContext]
interface SerialConnectionEvent : Event {
  constructor(DOMString type, SerialConnectionEventInit eventInitDict);
  [SameObject] readonly attribute SerialPort port;
};

dictionary SerialPortFilter {
  unsigned short vendorId;
  unsigned short productId;
};

dictionary SerialPortRequestOptions {
  sequence<SerialPortFilter> filters;
};

[Exposed=(DedicatedWorker,Window), SecureContext]
interface Serial : EventTarget {
  attribute EventHandler onconnect;
  attribute EventHandler ondisconnect;
  Promise<sequence<SerialPort>> getPorts();
  [Exposed=Window] Promise<SerialPort> requestPort(optional SerialPortRequestOptions options = {});
};

[Exposed=(DedicatedWorker,Window), SecureContext]
interface SerialPortInfo {
  maplike<DOMString, DOMString?>;
};

[Exposed=(DedicatedWorker,Window), SecureContext]
interface SerialPort {
  readonly attribute ReadableStream readable;
  readonly attribute WritableStream writable;

  SerialPortInfo getInfo();
  Promise<void> open(SerialOptions options);
  Promise<void> setSignals(SerialOutputSignals signals);
  Promise<SerialInputSignals> getSignals();
  void close();
};
```

## Security considerations

This API poses similar a security risk to the Web Bluetooth and WebUSB APIs and so lessons from those are applicable here. The primary threats are:

* Exploitation of a device’s capabilities by malicious code that has been granted access.
* Installation of malicious firmware on a device that can be used to attack the host to which it is connected.
* Malicious code injected into a site which has been granted access doing any of the above.

The primary mitigation is a permission model that grants access to only a single device at a time. In response to the prompt displayed by a call to `requestDevice()` the user must take active steps to select a particular device. This prevents drive-by attacks against connected devices. Implementations may also give the users a visual indication that a page is currently communicating with a device and controls for revoking that permission at any time.

The user agent must also require the page to be served from a secure origin in order to prevent malicious code from being injected by a network-based attacker. Secure delivery of code does not indicate that the code is trustworthy but is a minimum requirement for ensuring that other security decisions being made based on the site's origin are effective. The user agent must also prevent cross-origin iframes from using the API unless explicitly granted permission by the embedding page through [Feature Policy](https://w3c.github.io/webappsec-feature-policy/). This mitigates most malicious code injection attacks unless the trusted site itself is compromised.

The remaining concern is the exploitation of a connected device through a phishing attack that convinces the user to grant a malicious site access to a device. These attacks exploit the trust that a device typically places in the host computer it is connected to and can be used to either exploit the device’s capabilities as designed or to install malicious firmware on the device that will in turn attack the host computer. There is no mechanism that will completely prevent this type of attack because the meaning of the data sent from a page to the device is opaque to the user agent. Any attempt to block a particular type of data from being sent will be met by workarounds on the part of device manufacturers who nevertheless want to send this type of data to their devices.

User agents may implement additional settings to mitigate potential phishing attacks:

* Settings to allow the user to change the default permission setting for this API from “ask” (meaning that the permission prompt is shown) to “block” which prevents the prompt from being displayed entirely.
* Enterprise policy settings so that concerned systems administrators can apply this default throughout their organization. This default could be overridden for particular trusted origins.
* A list of the USB and Bluetooth device IDs for hardware which is known to be exploitable can be distributed to user agents by the vendor and a centralized registry similar the ones maintained for [Web Bluetooth](https://github.com/WebBluetoothCG/registries) and [WebUSB](https://github.com/WICG/webusb/blob/master/blocklist.txt). Connections to these devices would be blocked.

This final mitigation is more difficult to apply to this API. There are a number of reasons for this. First, it is difficult to define what “exploitable” means. For example, this API will allow a page to upload firmware to Arduino boards. This is in fact a major use case for this API as these devices are common in the educational and hobbyist markets. These boards do not implement firmware signature verification and so can easily be turned into a malicious device. Should they be blocked? No, Arduino users have to accept this risk.

Also, unlike USB and Bluetooth devices, it is difficult to obtain the true identity of a serial device as it may be connected to directly to the host via a a DB-25, DE-9 or RJ-45 connector for which there is no handshake to establish identity, or through a generic USB- or Bluetooth-to-serial adapters.

## Privacy considerations

Serial devices contain two kinds of sensitive information,

1. When the device is a USB or Bluetooth device there are identifiers such as the vendor and product IDs (which identify the make and model) as well as a serial number or MAC address.
2. Additional identifiers may be available through commands sent via the serial port. The device may also store other private information which may or may not be considered private.

For the same reasons mentioned in the “Security considerations” section reguarding preventing a device from being programmed with malicious firmware it is impractical to prevent a page from accessing this information once it has been granted access. Instead the permission model gives the user control over exactly which devices a page has access to in the first place. A page cannot proactively enumerate the devices that could be chosen. This is similar to the file picker UI. A site cannot arbitrarily access the filesystem, only the files that have been chosen by the user. Once a file has been selected the site has access to the complete file. The user agent can also notify the user in real time when a page is using these permissions with some kind of indicator.
