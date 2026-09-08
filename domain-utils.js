(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.RTBFDomainUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalizeHostname(hostname) {
    return String(hostname || "").toLowerCase().replace(/\.$/, "");
  }

  function isSubdomainMatch(currentDomain, websiteDomain) {
    const current = normalizeHostname(currentDomain);
    const website = normalizeHostname(websiteDomain);
    return Boolean(current && website && (current === website || current.endsWith("." + website)));
  }

  function findWebsite(websites, hostname) {
    return websites.find((item) => isSubdomainMatch(hostname, item.website));
  }

  return { normalizeHostname, isSubdomainMatch, findWebsite };
});
