# Security and Privacy Questionnaire

Questions pulled from the [Self-Review Questionaire on Security and Privacy](https://www.w3.org/TR/security-privacy-questionnaire/).

## What information might this feature expose to Web sites or other parties, and for what purposes is that exposure necessary?

This questionnaire is specifically about the "Bluetooth RFCOMM in Web Serial API" feature which enables applications to access serial interfaces on Bluetooth devices. See EXPLAINER_BLUETOOTH.md.

Much of the same information is exposed for Bluetooth RFCOMM serial ports as for non-Bluetooth serial ports. Copied from security-privacy-questionnaire.md:

> By allowing a site to communicate with a peripheral device it is exposed to any information that the device makes available through that connection. For example, a device may provide a command for checking the currently installed firmware version or reading the serial number, which must be assumed to be unique. The device may also have access to information about the user's environment. For example, it may include a temperature sensor.

> No effort is made by this specification to limit the type of data that can be read from the device once the user has granted a site permission to communicate with it. The reason for this is that serial device communication is a bidirectional byte stream that is entirely opaque to the user agent.

> The trade-off being made is that users benefit from being able to perform a task using a web application rather than a native application. Web applications do not require installation and so are ideal for tasks that are performed infrequently. They are also sandboxed away from both the underlying platform and each other. Access to a powerful capability such as communication with a connected serial device can be placed behind a permission request that only grants a site access to a particular device, rather than the ability to run arbitrary native code on the user's system and access to all capabilities granted by default on the native platform.

Specific to the Bluetooth RFCOMM case, we will add a new `SerialPortInfo` dictionary member `bluetoothServiceClassId` which will expose the service class UUID of the connected RFCOMM service.
It is necessary to expose this information so that applications can distinguish between two `SerialPort` instances created for different RFCOMM services on the same Bluetooth device.
The service UUID must be exposed without modification because the value is decided by the manufacturer and applications expect to be able to match against the exact value.
[Design principles](https://www.w3.org/TR/design-principles/#device-ids) suggests to use a random number in place of unique identifiers.
This is not possible for service class UUIDs since the exact value of the UUID is known by the application and used to identify supported features on the device.
Similar to other device identifiers like USB vendor and product IDs, service class UUIDs are not truly unique device identifiers as every instance of a particular device model is expected to have the same service UUIDs.

## Do features in your specification expose the minimum amount of information necessary to enable their intended uses?

Web Serial API uses a permission prompt to gate access to device information:

> The specification minimizes the information exposed to a site by gating all access to devices and their properties behind a permission request that requires the user to select a single device. This mitigates "drive by" attacks which could attempt to fingerprint a user by detecting the types of devices they have connected.

> As explained above, however, once the user grants a site permission to communicate with a device it becomes impractical to limit the types of device properties that it could observe.

Specific to Bluetooth RFCOMM ports, we will include the service class UUID in `SerialPortInfo` because it is necessary for disambiguation when a device exposes multiple serial ports.

## How do the features in your specification deal with personal information, personally-identifiable information (PII), or information derived from them?

This specification does not deal directly with personal information or personally-identifiable information, although device identifiers can expose such information.
For instance, some devices support changing the product name for personalization.
If a user configures the product name of their device to include personal information ("Larry's Earbuds") then granting permission for a site to access the device will expose their personal information to the script.
No attempt is made to detect or mitigate this risk as it is not possible to determine if the product name can be configured or if it contains private information.

Device identifiers like Bluetooth device addresses and service class UUIDs can be used for active fingerprinting.
To mitigate fingerprinting risk, the API defaults to exposing no information about connected devices and does not include the Bluetooth device address in `SerialPortInfo`.
Device information in `SerialPortInfo`, including the service class UUID for RFCOMM serial ports, is only exposed for devices that are currently connected and the user has already granted permission for the site to access.

Device access may also expose personal information.
For example, the Bluetooth Classic [Phone Book Access Profile](https://www.bluetooth.com/specifications/specs/phone-book-access-profile-1-2-3/) supports transferring contact information from the user's mobile phone.
To mitigate the risk of exposing personal information through standard Bluetooth Classic profiles, this feature will block access to all standard Bluetooth Classic service class UUIDs except Serial Port Profile.

## How do the features in your specification deal with sensitive information?

The answer to this question is the same as for the previous question.

## Do the features in your specification introduce new state for an origin that persists across browsing sessions?

No, this specification only augments the existing serial port permission to support new types of serial ports.

## Do the features in your specification expose information about the underlying platform to origins?

Yes, this feature is designed to expose information about Bluetooth serial devices connected to the host.
To mitigate the risk of exposing information about the underlying platform, no information is exposed until the user has granted permission for the origin to access a device.

## Does this specification allow an origin to send data to the underlying platform?

Yes, this feature will use platform Bluetooth APIs to communicate with connected serial devices.

## Do features in this specification enable access to device sensors?

Yes, this feature enables access to sensors implemented as serial devices.

Some Bluetooth Classic profiles are intended for sensor data.
For example, the [Global Navigation Satellite System Profile](https://www.bluetooth.com/specifications/specs/global-navigation-satellite-system-profile-1-0/) streams [NMEA 0183](https://en.wikipedia.org/wiki/NMEA_0183) formatted data from GPS receivers.
To mitigate the risk of exposing sensor data, this feature will block access to all standard Bluetooth Classic service class UUIDs except Serial Port Profile.

## Do features in this specification enable new script execution/loading mechanisms?

No.

## Do features in this specification allow an origin to access other devices?

Yes, this feature enables access to connected Bluetooth Classic peripherals with Serial Port Profile services or non-standard RFCOMM services.
To mitigate the risk of accessing other devices, this feature will block access to all standard Bluetooth Classic service class UUIDs except Serial Port Profile.

## Do features in this specification allow an origin some measure of control over a user agent’s native UI?

No.

## What temporary identifiers do the features in this specification create or expose to the web?

This specification does not create temporary identifiers.

## How does this specification distinguish between behavior in first-party and third-party contexts?

The answer is the same as the main security-privacy-questionnaire.md:

> This specification leverages [Feature Policy](https://w3c.github.io/webappsec-feature-policy/) to control access to this feature in third-party contexts. The default policy is `['self']` which restricts the feature to only first-party contexts. If a third-party context is trusted by the first-party context it can be explicitly granted access to the feature.

> Access to this feature by third-party contexts is useful because it allows functionality to be composed between sites. For example, a site cataloging 3D models could embed a third-party `<iframe>` element from a 3D printer manufacturer that supports sending the model to the printer using this API. Since this third-party context is trusted to perform this function by the first-party context it would be explicitly allowed to use the feature using the `allow="serial"` attribute. Other third-party contexts on the page, such as advertisments, would not be allowed to use the feature.

## How do the features in this specification work in the context of a browser’s Private Browsing or Incognito mode?

The answer is the same as the main security-privacy-questionnaire.md:

> Implementations of this specification are expected to implement separate storage for device permissions between the "normal" and "incognito" modes. This mitigates passive leakage of information between sessions. Permissions granted during a private browsing session are expected to be cleared at the end of that session.

> As discussed above, communication with a device grants a site the ability to read potentially identifying information from the device. Implementations should frame a site's permission request in a way that brings the user's attention to the powerful nature of this request using words like "access" or "control". In an incognito context this message may be strengthened to highlight the potential for this action to "unmask" a user in the same way that entering personal credentials or uploading a file would.

> Since the default state before any permissions are granted is that the site has access to no devices it is not possible to detect an incognito session using this API.

## Does this specification have both "Security Considerations" and "Privacy Considerations" sections?

Yes, see [Web Serial API](https://wicg.github.io/serial/) for general considerations and EXPLAINER_BLUETOOTH.md for considerations specific to Bluetooth RFCOMM serial ports.

## Do features in your specification enable origins to downgrade default security protections?

No.

## How does your feature handle non-"fully active" documents?

The Web Serial API specification has not yet been updated to handle back/forward cache.

## What should this questionnaire have asked?

I can't think of anything else.
