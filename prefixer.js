(function () {
  // Current subpath, no trailing slash
  var prefix = (location.pathname || '').replace(/\/+$/,'');
  if (!prefix) return;

  function addPrefix(u) {
    if (!u || typeof u !== 'string') return u;
    if (/^https?:\/\//i.test(u)) return u;        // absolute
    if (u.startsWith(prefix + '/')) return u;     // already prefixed
    if (u.startsWith('/')) return prefix + u;     // leading slash -> prefix it
    return u;                                     // relative path -> leave
  }

  // Patch fetch
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      return _fetch(addPrefix(input), init);
    } else if (input && input.url) {
      var req = new Request(addPrefix(input.url), input);
      return _fetch(req, init);
    }
    return _fetch(input, init);
  };

  // Patch XMLHttpRequest
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    var args = Array.prototype.slice.call(arguments);
    args[1] = addPrefix(url);
    return _open.apply(this, args);
  };
})();
