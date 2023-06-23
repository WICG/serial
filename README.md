# Serial API

[Serial ports API](http://wicg.github.io/serial/) for the platform. 

### Explainer

Details about the API including example usage code snippets and its motivation, privacy, and security considerations are described in [EXPLAINER.md](./EXPLAINER.md). Extensions to this API to support connections to Bluetooth RFCOMM services are described in [EXPLAINER_BLUETOOTH.md](./EXPLAINER_BLUETOOTH.md).

### Code of conduct

We are committed to providing a friendly, safe and welcoming environment for all. Please read and respect the [W3C Code of Ethics and Professional Conduct](https://www.w3.org/Consortium/cepc/).

### Implementation status

This API has two implementations: [Blink](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/serial/) and [a polyfill](https://github.com/google/web-serial-polyfill/)

The Blink implementation is available in browsers based on Chromium 89 and later, such as Google Chrome and Microsoft Edge. Individual Chromium-based browsers may choose to enable or disable this API. Chromium-based Android browsers do not support this API because Android itself does not provide a direct API for accessing serial ports. For the same reason this API is not available in Android WebView ([Chromium issue 1164036](https://crbug.com/1164036)).

The polyfill implementation is based on the WebUSB API and currently only supports standard USB communications class devices but could be expanded to support other proprietary USB to serial adapters. It could also be expanded to support Bluetooth Low Energy UARTs via the Web Bluetooth API. Because both WebUSB and Web Bluetooth are available in Chromium-based browsers on Android the polyfill is an option for sites to support Android while using the native browser implementation on desktop platforms.
