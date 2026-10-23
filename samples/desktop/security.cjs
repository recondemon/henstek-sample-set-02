function isAppPage(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "venue:" &&
      url.host === "app" &&
      !url.username &&
      !url.password &&
      !url.search &&
      url.pathname === "/index.html"
    );
  } catch {
    return false;
  }
}
module.exports = { isAppPage };
