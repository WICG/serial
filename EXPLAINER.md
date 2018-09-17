# Serial API

The Serial API provides a way for websites to read and write from a serial device through script. This API bridges the web and the physical world by allowing documents to communicate with devices such as microcontrollers, 3D printers, and other serial devices.

## The hardware landscape

While more modern technologies such as Bluetooth and USB have gained enormous traction the venerable serial port still an important part of the hardware landscape. Even when the physical transport is one of these other interconnects a translation layer (such as the Bluetooth SPP, USB CDC-ACM protocol, or proprietary alternatives from various manfacturers) still provides developers with the same programming model as a dedicated RS-232 port. For developers to build applications for these devices the web platform must provide a means to interact with them at the level where the operating system provides an interface. For example, if a USB device implements USB CDC-ACM the class driver will claim that interface and provide a virtual COM port. At this point another API such as [WebUSB](https://wicg.github.io/webusb/) becomes inappropriate since the interface is claimed by something else. An application that wants to connect to the device must interact with it through the existing system driver.

## Example

Note, this example presumes changes based on the designs of other APIs that have not yet been integrated into this specification.

```javascript
var filter = {
  manufacturer: "Arduino"
};
try {
  let port = await navigator.serial.requestPort({filters: [filter]});
  await port.open();
  let reader = port.in.getReader();
  while(let data = yield reader.read()) {
    console.log(data);
  }
} catch (err) {
  console.error(err);
}
```
