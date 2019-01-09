var respecConfig = {
  // disable auto generation of tables by ReSpec
  noLegacyStyle: true,
  format: "markdown",

  // specification status (e.g. WD, LCWD, WG-NOTE, etc.). If in doubt use ED.
  specStatus: "unofficial",

  // the specification's short name, as in http://www.w3.org/TR/short-name/
  shortName: "serial",

  // if your specification has a subtitle that goes below the main
  // formal title, define it here
  subtitle: "Living document",

  // if you wish the publication date to be other than the last modification, set this
  // publishDate:  "2009-08-06",

  // if the specification's copyright date is a range of years, specify
  // the start date here:
  // copyrightStart: "2005"

  // if there is a previously published draft, uncomment this and set its YYYY-MM-DD date
  // and its maturity status
  // previousPublishDate:  "1977-03-15",
  // previousMaturity:  "WD",

  // if there a publicly available Editor's Draft, this is the link
  // edDraftURI:           "http://berjon.com/",

  // if this is a LCWD, uncomment and set the end of its review period
  // lcEnd: "2009-08-05",

  // editors, add as many as you like
  // only "name" is required
  editors: [
    {
      name: "See contributors on GH",
      url: "https://github.com/wicg/serial/graphs/contributors"
    },
  ],

  // name of the WG
  wg: "Web Platform Incubator Community Group",

  // URI of the public WG page
  wgURI: "https://www.w3.org/community/wicg/",

  // name (without the @w3c.org) of the public mailing to which comments are due
  wgPublicList: "public-wicg",

  // URI of the patent status for this WG, for Rec-track documents
  // !!!! IMPORTANT !!!!
  // This is important for Rec-track documents, do not copy a patent URI from a random
  // document unless you know what you're doing. If in doubt ask your friendly neighbourhood
  // Team Contact.
  wgPatentURI: "",
  // !!!! IMPORTANT !!!! MAKE THE ABOVE BLINK IN YOUR HEAD
  otherLinks: [{
    key: "Repository",
    data: [
      {
        href: "https://github.com/wicg/serial"
      },
      {
        value: "issues",
        href: "https://github.com/wicg/serial/issues"
      },
      {
        value: "Commit History.",
        href: "https://github.com/wicg/serial/commits/gh-pages"
      }]
  }],
  localBiblio: {
    STREAMS: {
        "authors": ["Domenic Denicola"],
        "href": "https://github.com/whatwg/streams",
        "title": "Streams API",
        "status": "unofficial",
        "publisher": "WHATWG",
    }
  },
	additionalCopyrightHolders: "<a href='http://creativecommons.org/publicdomain/zero/1.0/' rel='license'><img alt='CC0' src='http://i.creativecommons.org/p/zero/1.0/80x15.png'></a> To the extent possible under law, the editor has waived all copyright and related or neighboring rights to this work. In addition, as of 25 October 2013, the editor has made this specification available under the <a href='http://www.openwebfoundation.org/legal/the-owf-1-0-agreements/owfa-1-0' rel='license'>Open Web Foundation Agreement Version 1.0</a>, which is available at http://www.openwebfoundation.org/legal/the-owf-1-0-agreements/owfa-1-0.",
};
