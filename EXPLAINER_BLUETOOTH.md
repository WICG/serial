## Serial via Bluetooth Classic Explainer

A proposal to add support for Bluetooth serial ports to the Web Serial API.

## Motivation

Although most current development activity on Bluetooth technology focuses on
Bluetooth Low Energy (BLE) and mesh, active development still exists on
Bluetooth BR/EDR (AKA "classic"). The Bluetooth classic
[Serial Port Profile](https://www.bluetooth.com/specifications/specs/serial-port-profile-1-2/)
(SPP) remains a popular profile, has support from currently shipping hardware,
and at present has no suitable replacement in BLE.

New hardware is still being introduced with performance characteristics that
need the latency & bandwidth of SPP. We can address this need by exposing serial
connections via the Web Serial API.

Some use cases which consistently come up requiring Bluetooth serial support,
such as:

1. Bluetooth devices that expose a serial interface using the standard Serial
   Port service are supported by some platforms but the experience is
   inconsistent without explicit support from the Web Serial API.
2. Devices may implement the Serial Port Profile without using the standard
   Serial Port service. Explicit support from the Web Serial API is needed for
   these devices.
3. Consumers and device manufacturers that augment existing wired serial devices
   with Bluetooth capabilities using drop-in modules that expose a serial
   interface.

The Web Serial API can currently utilize Bluetooth serial ports, but with a few
caveats:

1. The Bluetooth device must first be bonded (often called "paired") before
   executing `SerialPort.requestPort()`. This is usually done manually via the
   system’s Bluetooth control/settings panel. This is not implemented on all
   platforms.
2. A Bluetooth serial port may only be accessed if the operating system maps the
   port to a device node. (For example, a POSIX device file or Windows COM
   port.)

## What does this proposal add?

This proposal adds the ability for the browser to:

1. Enumerate bonded Bluetooth devices that expose a serial interface using the
   standard Serial Port service.
2. Communicate with the serial interface even if the operating system has not
   created a device node for that port.
3. Communicate with a non-Serial Port service that exposes a serial interface.
   See [Non-standard Service Class ID’s](#non-standard-service-class-ids) below.

## Why not enhance Web Bluetooth?

The intent is to avoid the tendency to backfill Bluetooth Classic support into
[Web Bluetooth](https://webbluetoothcg.github.io/web-bluetooth/). If support for
one profile were to land in Web Bluetooth, developers might
request the addition of other classic profiles to Web Bluetooth. Support for
Bluetooth serial interfaces is seen as a special case as it is so frequently
requested by developers needing basic serial port support with
no simple alternative in BLE.

In short, this feature is a natural extension to the Web Serial API, and will
minimize requests for other classic profiles.

## Support for unmapped serial ports

When bonding to a Bluetooth device that exposes a serial port using the standard
Serial Port service, some operating systems will automatically create device
nodes representing the serial interface. Windows creates a pair of COM ports,
and macOS a pair of filesystem nodes in /dev (i.e. `/dev/cu.*` and
`/dev/tty.*`).

This proposal will allow support for Bluetooth services that implement the
Serial Port Profile even if the operating system does not create device nodes
for Bluetooth serial ports.

## Non-standard Service Class ID’s

Devices supporting the Serial Port Profile
([SPP](https://www.bluetooth.com/specifications/specs/serial-port-profile-1-2/))
often offer this via the standard Serial Port service (UUID: `0x1101`).
Operating systems may create devices or ports mapped to this Bluetooth service
during the bonding process. On macOS and Windows, two device nodes are created
for each bonded device that exposes a serial port using the standard Serial Port
service.

This proposal recommends supporting **any** service that implements the Serial
Port Profile, regardless of whether the service is a standard Serial Port
service or is automatically mapped by the operating system. By default
`Serial.requestPort()` will only include Bluetooth serial ports exposed by
devices with a standard Serial Port service. A new service UUID filter option is
added to `Serial.requestPort()` to enable requesting serial ports for other
services.

## Potential specification changes

### Port Selection

[`Serial.requestPort()`](https://developer.mozilla.org/en-US/docs/Web/API/Serial/requestPort),
with no filters parameter, will pass through:

1. Non-Bluetooth serial ports (wired, virtual, etc.)
2. Mapped Bluetooth serial ports.
3. Any unmapped serial port provided by a standard Bluetooth SerialPort service.
   These will appear on operating systems without automatic port mapping.

### Service Class ID Filtering

Serial ports for services other than the SerialPort service (UUID: `0x1101`)
can be requested, but will be omitted unless explicitly filtered for.

`Serial.requestPort()` will be extended to add new filtering abilities for
bonded Bluetooth devices with services implementing the SPP profile. At present
`requestPort()` accepts a single optional
[filters parameter](https://wicg.github.io/serial/#dom-serialportrequestoptions-filters)
– a sequence of
[`SerialPortFilter`](https://wicg.github.io/serial/#serialportfilter-dictionary)
instances with the following two members:

1. `usbVendorId`
2. `usbProductId`

To provide the ability to filter Bluetooth serial ports filters will need to
support filtering for a Bluetooth service identified by a service class ID. This
will be implemented by adding the following SerialPortFilter member:

1. `bluetoothServiceClassId`

Implementations may provide UI for the user to select certain device types such
as Wired, Bluetooth. This is an implementation issue left to browser vendors.

### Serial Port Info

Currently
[`SerialPort.getInfo()`](https://developer.mozilla.org/en-US/docs/Web/API/SerialPort/getInfo)
returns a [`SerialPortInfo`](https://wicg.github.io/serial/#serialportinfo-dictionary)
dictionary containing usbVendorId and usbProductId.

SerialPortInfo will be extended by adding the following member:

1. `bluetoothServiceClassId` (string) – The Bluetooth service class 128-bit
   UUID.

Opening a mapped port will return a btServiceClassId of `0x1101`.

### Port Persistence

The Web Serial API remembers serial ports granted access by
`Serial.requestPort()`. These can be retrieved by the page via the
[`Serial.getPorts()`](https://developer.mozilla.org/en-US/docs/Web/API/Serial/getPorts)
method.

Browser implementations may persist Bluetooth serial port access and return them
to the caller. Note that a persisted Bluetooth serial port may no longer be in
communications range. Browser implementations may choose to filter out devices
that cannot be reached, but this is not required. If the browser does not check
for device availability while resolving `Serial.getPorts()`, `SerialPort.open()`
will fail just as it would had that Bluetooth device been mapped as a serial
port by the OS.

### Events

Implementation of the
[`onconnect`](https://wicg.github.io/serial/#onconnect-attribute) and
[`ondisconnect`](https://wicg.github.io/serial/#ondisconnect-attribute) port
availability callbacks are not required. Implementation is recommended and the
expectation is that browsers will make a "best effort" to emit these events. If
a browser is aware of a change in a device's availability it must fire an
`onconnect`/`ondisconnect` event. Providing an implementation equivalent to a
wired serial port would necessitate that the host be in a continuous state of
scanning for Bluetooth devices – as long as at least one remembered Bluetooth
port is unavailable. This would negatively impact battery life and other system
resources.

Due to the transient nature of Bluetooth serial ports, and the lack of reliable
`onconnect`/`ondisconnect` events, applications will fall back to other Web
Serial methods. For example `ReadableStreamDefaultReader.read()` will fail if
called when the device is out of range.

## Security Considerations

This API change poses security risks that are a superset of those of the Web
Serial API. It is vulnerable to all risks described in
[Web Serial Explainer Security considerations](https://github.com/WICG/serial/blob/main/EXPLAINER.md#security-considerations).

As stated above, Bluetooth serial ports can be used today on most operating
systems, namely Windows, macOS, and Linux (with more effort). This proposal will
enable use of Bluetooth serial ports on those platforms that do not
automatically create serial device nodes for bonded Bluetooth devices. Adding
this support does not introduce a new type of security vulnerability, only makes
it possible on other platforms.

The new security consideration is from the proposal to add support for serial
ports implemented by non-standard Bluetooth services (see
[Non-standard Service Class ID’s](#non-standard-service-class-ids) above).
There is no current ability to do this from Web Serial. The same vulnerabilities
will be introduced by accessing non-standard serial ports as exist today for
mapped ports.

Like Web Serial, the primary mitigation is a permissions model that requires the
user to explicitly give access to a device. Additionally it must also be a
device to which the host computer is currently bonded.

User agents may implement additional settings to mitigate potential phishing
attacks:

* All [Bluetooth specified services](https://www.bluetooth.com/specifications/specs/)
  will be blocked. Only vendor defined service class ID’s will be exposed to Web
  Serial.
* Enterprise policy settings so that concerned systems administrators can
  disable  non-standard serial port services throughout their organization. This
  default could be overridden for particular trusted origins.
* Browsers may implement UUID blocklists to protect against exploits targeting
  known hardware vulnerabilities.

## Privacy Considerations

The page, when filtering for UUID’s, or by obtaining them via
`SerialPort.getInfo()`, may be able to determine the class of device to which
it has been connected.

As mentioned in the
[Web Serial Explainer Privacy considerations](https://github.com/WICG/serial/blob/main/EXPLAINER.md#privacy-considerations)
a page must first be explicitly given access to the Bluetooth serial device that
currently has a bonding relationship with the host. It cannot enumerate device
attributes, and this access grant may be revoked by the user.
