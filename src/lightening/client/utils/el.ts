export function el(...args: any[]) {
  var name = args[0];
  function isNode(n: any) {
    return n && typeof n === 'object' && n.nodeType && n.nodeName;
  }
  if (name === '<!') {
    return document.createComment(args[1]);
  } else if (name === '') {
    return document.createTextNode(args[1]);
  }
  var node = isNode(name) ? name : document.createElement(name);
  Array.prototype.slice.call(args, 1).forEach(function(arg: any) {
    if (arg instanceof Array) {
      arg.forEach(function(child) {
        child && node.appendChild(child);
      });
    } else if (typeof arg === 'object') {
      if (isNode(arg)) {
        node.appendChild(arg);
      } else if (arg) {
        Object.keys(arg).forEach(function(key) {
          node.setAttribute(key, arg[key]);
        });
      }
    } else if (['string', 'number', 'boolean'].indexOf(typeof arg) >= 0) {
      node.textContent = arg;
    }
  });
  return node;
}
