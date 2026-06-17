import { warnLog } from 'app/utils/log';

const TAG = 'translation-dom-guard';

/**
 * Browser page-translation tools (Google Translate, Edge/Chrome translate, etc.) mutate the
 * DOM out from under React: they replace text nodes with `<font>` wrappers and move nodes
 * around. When React later tries to remove or reorder a node it expects to still be where it
 * left it, `removeChild`/`insertBefore` throw `NotFoundError: ... not a child of this node`,
 * which crashes the whole app with no DIM frames in the stack.
 *
 * React deliberately won't work around this itself, so we guard the two DOM methods it relies
 * on: if the node isn't actually a child of the expected parent, we no-op instead of throwing.
 * This is the widely-used mitigation for the translator-vs-React crash.
 *
 * https://github.com/facebook/react/issues/11538
 */
if (typeof Node === 'function' && Node.prototype) {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- always invoked via .call(this, ...)
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if ($DIM_FLAVOR === 'dev') {
        warnLog(
          TAG,
          'skipped removeChild for a node that is not a child of this node',
          child,
          this,
        );
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method -- always invoked via .call(this, ...)
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    node: T,
    child: Node | null,
  ): T {
    if (child && child.parentNode !== this) {
      if ($DIM_FLAVOR === 'dev') {
        warnLog(
          TAG,
          'skipped insertBefore for a reference node that is not a child of this node',
          child,
          this,
        );
      }
      return node;
    }
    return originalInsertBefore.call(this, node, child) as T;
  };
}
