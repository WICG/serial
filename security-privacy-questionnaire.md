# Security and Privacy Questionnaire

Questions pulled from the [Self-Review Questionaire on Security and Privacy](https://www.w3.org/TR/security-privacy-questionnaire/).

## What information might this feature expose to Web sites or other parties, and for what purposes is that exposure necessary?

By allowing a site to communicate with a peripheral device it is exposed to any information that the device makes available through that connection. For example, a device may provide a command for checking the currently installed firmware version or reading the serial number, which must be assumed to be unique. The device may also have access to information about the user's environment. For example, it may include a temperature sensor.

No effort is made by this specification to limit the type of data that can be read from the device once the user has granted a site permission to communicate with it. The reason for this is that serial device communication is a bidirectional byte stream that is entirely opaque to the user agent.

The trade-off being made is that users benefit from being able to perform a task using a web application rather than a native application. Web applications do not require installation and so are ideal for tasks that are performed infrequently. They are also sandboxed away from both the underlying platform and each other. Access to a powerful capability such as communication with a connected serial device can be placed behind a permission request that only grants a site access to a particular device, rather than the ability to run arbitrary native code on the user's system and access to all capabilities granted by default on the native platform.

## Is this specification exposing the minimum amount of information necessary to power the feature?

The specification minimizes the information exposed to a site by gating all access to devices and their properties behind a permission request that requires the user to select a single device. This mitigates "drive by" attacks which could attempt to fingerprint a user by detecting the types of devices they have connected.

As explained above, however, once the user grants a site permission to communicate with a device it becomes impractical to limit the types of device properties that it could observe.

## How does this specification deal with personal information or personally-identifiable information or information derived thereof?

The capability granted by this specification does not directly deal with personal inforamtion or personally-identifiable information, however a particular device may contain such information and allowing a site to communicate with such a device could reveal this information. For example, a developer of a medical device could use this API in order to read and upload stored medical data to the cloud for analysis by the patient's doctor.

The permission model requires the user to concent to access by the site to the device.

## How does this specification deal with sensitive information?

The answer to this is the same as the question above.

To protect the potentially sensitive data that can be read from the device the specification requires that the API be accessible only from secure contexts. This does not prevent malicious use of the API but ensures,

* that the user's decision to grant the site permission to access a device is meaningful by validating that the origin displayed is accurate,
* that the site content has not been tampered with by an active network attacker, and
* that any data sent back to the site is not visibile to a passive network attacker.

## Does this specification introduce new state for an origin that persists across browsing sessions?

This specification introduces a new permission which associates a set of devices with an origin. For frequently visited sites experience with other APIs such as Web Bluetooth shows that users prefer not to be asked to grant the same permission for every session. Implementations may therefore support persisting the user's choice between sessions. This permission is state that persists across browsing sessions. Implementations should clear this state when the user indicates they would like to clear other site data such as cookies and local storage. Implementations may also make remembering the user's choices optional, time limited or expire after a site has not been visited for some time.

In addition it must be assumed that the device may support configuration and data storage that persists between sessions. This state is stored by the device itself and cannot be cleared by the user agent. The permission model is designed to treat access to a device the same way as access to a local file, since both represent state which is outside of the user agent's control.

## What information from the underlying platform, e.g. configuration data, is exposed by this specification to an origin?

No information from the underlying platform is exposed by this specification without user interaction. Once a user has chosen a device to grant a site permission to access that site has access to any information available by communicating with that device as well as basic properties of the device such as a device name, model ID or serial number. The specification does not attempt to obfuscate these IDs because it is assumed that the data is also available by directly communiating with the device in a way that is opaque to the user agent.

Data available from a device is consistent across origins, assuming that the user has granted multiple origins permission to access the same device.

## Does this specification allow an origin access to sensors on a user’s device

A serial device may be a sensor connected to or built into the user's device.

## What data does this specification expose to an origin? Please also document what data is identical to data exposed by other features, in the same or different contexts.

The specification exposes information from the underlying platform as described above.

## Does this specification enable new script execution/loading mechanisms?

No.

## Does this specification allow an origin to access other devices?

This specification allows an origin to communicate directly with serial devices. The risks and mitigations are addressed elsewhere in this questionnaire.

## Does this specification allow an origin some measure of control over a user agent’s native UI?

No. The `requestDevice()` method, which can cause the user agent to display native UI, requires a user gesture in order to mitigate abuse.

## What temporary identifiers might this this specification create or expose to the web?

This specification does not create temporary identifiers.

## How does this specification distinguish between behavior in first-party and third-party contexts?

This specification leverages [Feature Policy](https://w3c.github.io/webappsec-feature-policy/) to control access to this feature in third-party contexts. The default policy is `['self']` which restricts the feature to only first-party contexts. If a third-party context is trusted by the first-party context it can be explicitly granted access to the feature.

Access to this feature by third-party contexts is useful because it allows functionality to be composed between sites. For example, a site cataloging 3D models could embed a third-party `<iframe>` element from a 3D printer manufacturer that supports sending the model to the printer using this API. Since this third-party context is trusted to perform this function by the first-party context it would be explicitly allowed to use the feature using the `allow="serial"` attribute. Other third-party contexts on the page, such as advertisments, would not be allowed to use the feature.

## How does this specification work in the context of a user agent’s Private Browsing or "incognito" mode?

Implementations of this specification are expected to implement separate storage for device permissions between the "normal" and "incognito" modes. This mitigates passive leakage of information between sessions. Permissions granted during a private browsing session are expected to be cleared at the end of that session.

As discussed above, communication with a device grants a site the ability to read potentially identifying information from the device. Implementations should frame a site's permission request in a way that brings the user's attention to the powerful nature of this request using words like "access" or "control". In an incognito context this message may be strengthened to highlight the potential for this action to "unmask" a user in the same way that entering personal credentials or uploading a file would.

Since the default state before any permissions are granted is that the site has access to no devices it is not possible to detect an incognito session using this API.

## Does this specification have a "Security Considerations" and "Privacy Considerations" section?

Yes, as of writing the [Security considerations](https://github.com/WICG/serial/blob/gh-pages/EXPLAINER.md#security-considerations) and [Privacy considerations](https://github.com/WICG/serial/blob/gh-pages/EXPLAINER.md#privacy-considerations) sections in the explainer are the most complete.

## Does this specification allow downgrading default security characteristics?

No.

## What should this questionnaire have asked?

When considering adding a feature to the web platform it is useful to consider how other platforms control access to the same feature. In this case desktop platforms do not require any user consent before granting an application access to a serial device.
