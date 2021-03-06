type ScalarArg = string | number | boolean;
type FalsyArg = null | undefined | false;
type EventHandlerMap = { [event in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[event]) => any };
type HtmlAttributeMap = { [attribute in HtmlAttribute]: string };
type ElementProps = Partial<HtmlAttributeMap & EventHandlerMap>;
type VarArg = ElementProps | ScalarArg | HTMLElement | FalsyArg | (HTMLElement | FalsyArg)[];
type ValidTagMap = HTMLElementTagNameMap & SVGElementTagNameMap;
type ElFactory<T extends keyof ValidTagMap> = (...args: VarArg[]) => ValidTagMap[T];

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
          if (typeof arg[key] === 'function') {
            node.addEventListener(key, arg[key]);
          } else {
            node.setAttribute(key, arg[key]);
          }
        });
      }
    } else if (['string', 'number'].indexOf(typeof arg) >= 0) {
      node.textContent = arg;
    }
  });
  return node;
}

// Export ready-made factories for the usual suspects, for convenience:
export const a: ElFactory<'a'> = (el as any).bind(null, 'a');
export const button: ElFactory<'button'> = (el as any).bind(null, 'button');
export const img: ElFactory<'img'> = (el as any).bind(null, 'img');
export const input: ElFactory<'input'> = (el as any).bind(null, 'input');
export const label: ElFactory<'label'> = (el as any).bind(null, 'label');
export const li: ElFactory<'li'> = (el as any).bind(null, 'li');
export const object: ElFactory<'object'> = (el as any).bind(null, 'object');
export const ol: ElFactory<'ol'> = (el as any).bind(null, 'ol');
export const option: ElFactory<'option'> = (el as any).bind(null, 'option');
export const p: ElFactory<'p'> = (el as any).bind(null, 'p');
export const pre: ElFactory<'pre'> = (el as any).bind(null, 'pre');
export const select: ElFactory<'select'> = (el as any).bind(null, 'select');
export const span: ElFactory<'span'> = (el as any).bind(null, 'span');
export const svg: ElFactory<'svg'> = (el as any).bind(null, 'svg');
export const div: ElFactory<'div'> = (el as any).bind(null, 'div');
export const table: ElFactory<'table'> = (el as any).bind(null, 'table');
export const tbody: ElFactory<'tbody'> = (el as any).bind(null, 'tbody');
export const td: ElFactory<'td'> = (el as any).bind(null, 'td');
export const textarea: ElFactory<'textarea'> = (el as any).bind(null, 'textarea');
export const tfoot: ElFactory<'tfoot'> = (el as any).bind(null, 'tfoot');
export const th: ElFactory<'th'> = (el as any).bind(null, 'th');
export const thead: ElFactory<'thead'> = (el as any).bind(null, 'thead');
export const tr: ElFactory<'tr'> = (el as any).bind(null, 'tr');
export const ul: ElFactory<'ul'> = (el as any).bind(null, 'ul');

// @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
type HtmlAttribute =
  | 'accept'
  | 'accept-charset'
  | 'accesskey'
  | 'action'
  | 'align'
  | 'allow'
  | 'alt'
  | 'async'
  | 'autocapitalize'
  | 'autocomplete'
  | 'autofocus'
  | 'autoplay'
  | 'bgcolor'
  | 'border'
  | 'buffered'
  | 'challenge'
  | 'charset'
  | 'checked'
  | 'cite'
  | 'class'
  | 'code'
  | 'codebase'
  | 'color'
  | 'cols'
  | 'colspan'
  | 'content'
  | 'contenteditable'
  | 'contextmenu'
  | 'controls'
  | 'coords'
  | 'crossorigin'
  | 'csp'
  | 'data' // Note: While setting an attribute like "data-foo" is perfectly fine during runtime, we can't accommodate all the possible options during compile time; this seems like an acceptable compromise
  | 'datetime'
  | 'decoding'
  | 'default'
  | 'defer'
  | 'dir'
  | 'dirname'
  | 'disabled'
  | 'download'
  | 'draggable'
  | 'dropzone'
  | 'enctype'
  | 'for'
  | 'form'
  | 'formaction'
  | 'headers'
  | 'height'
  | 'hidden'
  | 'high'
  | 'href'
  | 'hreflang'
  | 'http-equiv'
  | 'icon'
  | 'id'
  | 'importance '
  | 'integrity'
  | 'ismap'
  | 'itemprop'
  | 'keytype'
  | 'kind'
  | 'label'
  | 'lang'
  | 'language'
  | 'lazyload '
  | 'list'
  | 'loop'
  | 'low'
  | 'manifest'
  | 'max'
  | 'maxlength'
  | 'minlength'
  | 'media'
  | 'method'
  | 'min'
  | 'multiple'
  | 'muted'
  | 'name'
  | 'novalidate'
  | 'open'
  | 'optimum'
  | 'pattern'
  | 'ping'
  | 'placeholder'
  | 'poster'
  | 'preload'
  | 'radiogroup'
  | 'readonly'
  | 'rel'
  | 'required'
  | 'reversed'
  | 'rows'
  | 'rowspan'
  | 'sandbox'
  | 'scope'
  | 'scoped'
  | 'selected'
  | 'shape'
  | 'size'
  | 'sizes'
  | 'slot'
  | 'span'
  | 'spellcheck'
  | 'src'
  | 'srcdoc'
  | 'srclang'
  | 'srcset'
  | 'start'
  | 'step'
  | 'style'
  | 'summary'
  | 'tabindex'
  | 'target'
  | 'title'
  | 'translate'
  | 'type'
  | 'usemap'
  | 'value'
  | 'width'
  | 'wrap';
