var respecConfig = {
  specStatus: "CG-DRAFT",
  latestVersion: null,
  shortName: "serial",
  subtitle: "Living document",
  editors: [
    {
      name: "See contributors on GH",
      url: "https://github.com/wicg/serial/graphs/contributors"
    },
  ],
  logos: [{
    src: "images/logo_serial.svg",
    alt: "Serial API logo",
    width: 100,
    height: 100,
    id: 'spec-logo',
  }],
  group: "wicg",
  github: "https://github.com/wicg/serial",
  xref: [
    "DOM", "HTML", "Infra", "PERMISSIONS-POLICY", "STREAMS", "WebIDL",
    "web-bluetooth"
  ],
  // Suppress "Normative reference to BluetoothServiceUUID" warnings
  lint: { "informative-dfn": false }
};
