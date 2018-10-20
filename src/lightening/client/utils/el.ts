type ScalarArg = string | number | boolean;
type FalsyArg = null | undefined | false;
type ElementProps = { [attribute: string]: string };
type VarArg = ElementProps | ScalarArg | HTMLElement | FalsyArg | (HTMLElement | FalsyArg)[];

// Convenience method 1: Create a text node
export function el(tagName: '', textNodeContent: ScalarArg): Text;

// Convenience method 2: Create a comment node
export function el(tagName: '<!', commentNodeContent: ScalarArg): Comment;

// Convenience method 3: Adopt an existing node
export function el<N extends HTMLElement>(existingNode: N, ...args: VarArg[]): N;

// Default call signature: a named HTML tag type, followed up with 0 or more content
export function el<K extends keyof HTMLElementTagNameMap>(tagName: K, ...args: VarArg[]): HTMLElementTagNameMap[K];

// Actual implementation, directly ported from ES5-JS
// @see https://github.com/jareware/el-js
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
