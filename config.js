(function () {
  var basePath = location.pathname.replace(/\/+$/, ''); // keep your subpath; drop trailing slash
  var cfg = {
    apiProtocol: (location.protocol.replace(':','') || 'https'),
    apiServer:   location.host + basePath
  };
  // expose both shapes, old and new:
  // older GSA expects global 'config', some builds might read window.config
  // @ts-ignore
  config = cfg;
  // @ts-ignore
  window.config = cfg;
})();
