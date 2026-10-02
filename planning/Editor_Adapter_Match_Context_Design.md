# Editor Adapter Match Context Design

## Status

Deferred design guidance for a possible optimization to `IDomEditorAdapterFactory.findDefinition()`.

This design is not required for the initial contained-editor implementation. It should be introduced only if repeated descendant searches by related `IDomEditorAdapterDefinition` implementations become a meaningful cost or maintenance problem.

## Problem

Contained-editor definitions receive a container element rather than the native form control itself. Several definitions may need to search that container to determine whether it contains a compatible editor.

Without coordination, each definition may independently search the same descendant tree:

1. A contained text-input definition searches and does not match.
2. A contained checkbox definition repeats the search.
3. A contained radio-group definition repeats it again.
4. Third-party widget definitions may perform their own unrelated searches.

The repeated work is most noticeable when a container has a large descendant tree and no registered definition matches it.

Native `querySelector()` implementations are generally efficient, so this is an optimization rather than a prerequisite. The design must not assume that every editor is an `input`, `textarea`, or `select`. Third-party widget families must be able to cache their own matching work.

## Design Goals

- Create matching state for only one `findDefinition()` operation.
- Never retain element-specific matching state on registered adapter definitions.
- Allow related definitions to share one expensive resolution operation.
- Allow unrelated and third-party definitions to define their own matching context.
- Cache negative results as well as successful results.
- Pass the candidate element directly to context construction without requiring closure capture.
- Avoid any dependency on computed CSS display values.

## Non-Goals

- This mechanism does not select the winning adapter definition.
- It does not replace `adapterKey` or explicit adapter binding.
- It does not retain results between installation operations.
- It does not prescribe native HTML controls as the only supported editor model.
- It does not decide whether a candidate is visually block or inline.

## Two-Level Context Model

The design uses two distinct concepts:

1. `EditorAdapterMatchContexts` is the operation-scoped container. It owns a dictionary of matching contexts for one candidate element.
2. Implementations of `IEditorAdapterMatchContext` perform and retain family-specific matching work.

The plural class name distinguishes the dictionary container from each individual matching context.

```ts
export interface IEditorAdapterMatchContext
{
    readonly element: HTMLElement;
}
```

An individual context may expose any additional properties required by its related definitions. The shared interface intentionally establishes only the source element.

## Recommended Dictionary Container

The following version uses an explicit symbol key and a factory. The factory receives the candidate element as a parameter.

```ts
export class EditorAdapterMatchContexts
{
    constructor(private readonly element: HTMLElement)
    {
    }

    public getOrCreate<T extends IEditorAdapterMatchContext>(
        key: symbol,
        factory: (element: HTMLElement) => T
    ): T
    {
        if (!this.contexts.has(key))
            this.contexts.set(key, factory(this.element));

        return this.contexts.get(key) as T;
    }

    private readonly contexts = new Map<symbol, IEditorAdapterMatchContext>();
}
```

The implementation must use `Map.has()` instead of testing the retrieved value. This ensures that a created context representing a negative result is still reused.

Symbols prevent accidental key collisions. Related definitions share the same exported or module-private symbol. Unrelated third-party definitions create their own symbols.

## Factory Integration

`IDomEditorAdapterDefinition.matches()` receives the operation-scoped container:

```ts
interface IDomEditorAdapterDefinition
{
    readonly adapterKey: string;
    readonly priority: number;
    readonly defaultFieldPresentationName?: string | null;

    matches(element: HTMLElement, contexts: EditorAdapterMatchContexts): boolean;

    // Remaining members are unchanged.
}
```

`IDomEditorAdapterFactory.findDefinition()` creates one container and shares it across the ordered definitions:

```ts
public findDefinition(element: HTMLElement): IDomEditorAdapterDefinition | null
{
    const contexts = new EditorAdapterMatchContexts(element);

    for (const definition of this.definitions)
    {
        if (definition.matches(element, contexts))
            return definition;
    }

    return null;
}
```

Definitions that do not need shared matching work ignore the second parameter. TypeScript normally permits an implementation to declare fewer parameters than the interface method it satisfies, but this should be confirmed with the repository's compiler options before adopting the API change.

## Built-In Contained Native Editor Context

All built-in contained-native definitions can share one matching context:

```ts
export const containedNativeEditorMatchContextKey = Symbol('containedNativeEditor');

export type NativeEditorElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export class ContainedNativeEditorMatchContext implements IEditorAdapterMatchContext
{
    constructor(public readonly element: HTMLElement)
    {
        this.editor = element.childElementCount === 0 ? null : this.findEditor(element);
    }

    public readonly editor: NativeEditorElement | null;

    protected findEditor(element: HTMLElement): NativeEditorElement | null
    {
        return element.querySelector('input, textarea, select');
    }
}
```

`childElementCount === 0` is an inexpensive rejection test that avoids a descendant query. It does not establish whether an element is block or inline and does not prove that an element with children is an editor container.

The selector shown above is intentionally preliminary. Before implementation, it should be aligned with the exact native input types supported by the built-in adapter definitions. One centralized resolver should define what counts as the first supported native editor.

A related definition retrieves the shared result without performing another search:

```ts
const matchContext = contexts.getOrCreate(
    containedNativeEditorMatchContextKey,
    element => new ContainedNativeEditorMatchContext(element)
);

const editor = matchContext.editor;
return editor instanceof HTMLInputElement && this.matchesInputType(editor.type);
```

The first related definition creates the context. Later definitions reuse it, including when `editor` is `null`.

## Third-Party Widget Example

A third-party widget family defines its own key and context implementation:

```ts
const calendarWidgetMatchContextKey = Symbol('calendarWidget');

class CalendarWidgetMatchContext implements IEditorAdapterMatchContext
{
    constructor(public readonly element: HTMLElement)
    {
        this.editor = element.childElementCount === 0
            ? null
            : element.querySelector<HTMLElement>('[data-calendar-editor]');
    }

    public readonly editor: HTMLElement | null;
}
```

All adapter definitions belonging to that widget family reuse it:

```ts
const matchContext = contexts.getOrCreate(
    calendarWidgetMatchContextKey,
    element => new CalendarWidgetMatchContext(element)
);

return matchContext.editor !== null;
```

The factory and the built-in native context know nothing about the widget's DOM model.

## Alternative: Constructor as Dictionary Key

The context implementation constructor can serve as both the dictionary key and the factory:

```ts
type EditorAdapterMatchContextConstructor<T extends IEditorAdapterMatchContext> =
    new (element: HTMLElement) => T;
```

```ts
public getOrCreate<T extends IEditorAdapterMatchContext>(
    contextType: EditorAdapterMatchContextConstructor<T>
): T
{
    if (!this.contexts.has(contextType))
        this.contexts.set(contextType, new contextType(this.element));

    return this.contexts.get(contextType) as T;
}
```

Usage becomes:

```ts
const matchContext = contexts.getOrCreate(ContainedNativeEditorMatchContext);
```

Advantages:

- No separate symbol declaration.
- No closure or factory expression at the call site.
- The context type naturally identifies the cached operation.

Tradeoffs:

- A context class can have only one cached instance per candidate element unless another wrapper class is introduced.
- Definitions cannot use the same implementation class under multiple independently configured keys.
- The dictionary must use constructor functions as keys.

The explicit-key and constructor-key designs are both viable. Selection between them is intentionally deferred.

## Container Detection Guidance

`HTMLElement` does not expose an intrinsic block-versus-inline property. Tag-specific subclasses such as `HTMLDivElement` and `HTMLSpanElement` do not establish their computed display, because CSS can change it.

Avoid using `getComputedStyle(element).display` to decide whether matching should search descendants. It may require style resolution, has many possible values such as `block`, `inline-block`, `flex`, `grid`, and `contents`, and describes current rendering rather than editor semantics.

Useful inexpensive checks include:

- A supported native form control used directly as the anchor should be handled by its direct definition without a descendant search.
- `childElementCount === 0` proves that there is no descendant editor element.
- An explicit `adapterKey` or widget-specific marker can bypass automatic structural recognition.

The context implementation, not the generic dictionary container, owns any additional structural assumptions.

## Lifecycle and Immutability

Registered `IDomEditorAdapterDefinition` instances remain immutable and shared. They must not retain an `EditorAdapterMatchContexts` instance or any individual match context.

The factory creates the container at the start of `findDefinition()` and releases it when selection finishes. This prevents stale cached results when a widget later rebuilds its internal DOM.

Individual matching contexts must treat the candidate DOM as read-only. Matching must not add attributes, classes, event handlers, or Jivs state.

## Deferred Decisions

Before implementation, decide:

1. Whether the optimization is justified by observed complexity, profiling, or repeated matching code.
2. Whether dictionary entries use explicit symbol keys and factories or context constructors as keys.
3. Whether `EditorAdapterMatchContexts` should also have a public interface for dependency inversion.
4. The exact supported-native-editor resolver and input-type exclusions.
5. Whether the second `matches()` parameter is required or optional in the public interface.
6. Whether the context mechanism belongs in the initial public API or remains an internal factory facility until third-party demand is clearer.

## Recommended Adoption Sequence

1. Implement contained-editor definitions without this optimization if their repeated queries remain simple and bounded.
2. Keep descendant lookup code centralized within each related definition family where practical.
3. Add tests or profiling that demonstrate repeated traversal or duplicated matching logic.
4. Introduce the operation-scoped context container without changing adapter-selection semantics.
5. Convert one related family, such as the built-in contained-native definitions, to a shared context.
6. Document the extension point for third-party widget families only after its API has proven stable.
