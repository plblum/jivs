import type { IFieldValueHost, TextValueChangedHandler } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IValidatableValueHost, ValueHostValidationState, ValueHostValidationStateChangedHandler } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHost, ValueChangedHandler } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager, ValidationStateChangedHandler } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type {
    IFieldValidationDispatcher,
    IFormValidationDispatcher,
    ITextValueDispatcher,
    IValueDispatcher
} from '../../src/Interfaces/Dispatchers';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { DispatcherService } from '../../src/Dispatchers/DispatcherService';
import { FieldValidationDispatcher } from '../../src/Dispatchers/FieldValidationDispatcher';
import { FormValidationDispatcher } from '../../src/Dispatchers/FormValidationDispatcher';
import { TextValueDispatcher } from '../../src/Dispatchers/TextValueDispatcher';
import { ValueDispatcher } from '../../src/Dispatchers/ValueDispatcher';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ITestValueHostsManager extends IValueHostsManager
{
    onTextValueChanged: TextValueChangedHandler | null;
    onValueChanged: ValueChangedHandler | null;
    onValueHostValidationStateChanged: ValueHostValidationStateChangedHandler | null;
    onValidationStateChanged: ValidationStateChangedHandler | null;
}

interface IDispatcherCall
{
    kind: string;
    args: unknown[];
}

class TestDispatcherService extends DispatcherService
{
    public get publicify_domServices(): IJivsDomServices
    {
        return this.domServices;
    }
}

/**
 * Creates a manager double with mutable callbacks and metadata storage.
 */
function createValueHostsManager(callbacks: Partial<ITestValueHostsManager> = {}): ITestValueHostsManager
{
    let metadata = new Map<string, unknown>();
    return {
        onTextValueChanged: callbacks.onTextValueChanged ?? null,
        onValueChanged: callbacks.onValueChanged ?? null,
        onValueHostValidationStateChanged: callbacks.onValueHostValidationStateChanged ?? null,
        onValidationStateChanged: callbacks.onValidationStateChanged ?? null,
        getMetadata: (key: string): unknown | undefined => metadata.get(key),
        setMetadata: (key: string, value: unknown | undefined): void => {
            if (value === undefined)
                metadata.delete(key);
            else
                metadata.set(key, value);
        }
    } as unknown as ITestValueHostsManager;
}

/**
 * Creates a dispatcher double that records its category and every received argument.
 */
function createDispatcher(kind: string, calls: IDispatcherCall[]): {
    text: ITextValueDispatcher,
    value: IValueDispatcher,
    field: IFieldValidationDispatcher,
    form: IFormValidationDispatcher
}
{
    let dispatch = (...args: unknown[]): void => {
        calls.push({ kind: kind, args: args });
    };
    return {
        text: { dispatch: dispatch },
        value: { dispatch: dispatch },
        field: { dispatch: dispatch },
        form: { dispatch: dispatch }
    };
}

/**
 * Creates a DispatcherService with the shared mock DOM service dependency.
 */
function setup(): {
    domServices: IJivsDomServices,
    testItem: TestDispatcherService
}
{
    let domServices = createMockJivsDomServices();
    return {
        domServices: domServices,
        testItem: new TestDispatcherService(domServices)
    };
}

// DispatcherService requires and retains its DOM service scope.
describe('DispatcherService constructor', () => {
    test('Constructs with and retains the supplied DOM services', () => {
        let { domServices, testItem } = setup();

        expect(testItem.publicify_domServices).toBe(domServices);
    });

    test('Rejects null or undefined DOM services', () => {
        expect(() => new DispatcherService(null as unknown as IJivsDomServices))
            .toThrow(/domServices required/);
        expect(() => new DispatcherService(undefined as unknown as IJivsDomServices))
            .toThrow(/domServices required/);
    });
});

// Default creator registrations provide one standard dispatcher for each callback category.
describe('DispatcherService default dispatcher creators', () => {
    test('Creates the standard dispatcher for every category when no custom creator is registered', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();

        testItem.attach(valueHostsManager, true, true);

        expect(valueHostsManager.getMetadata('onTextValueChanged')).toBeInstanceOf(TextValueDispatcher);
        expect(valueHostsManager.getMetadata('onValueChanged')).toBeInstanceOf(ValueDispatcher);
        expect(valueHostsManager.getMetadata('onValueHostValidationStateChanged'))
            .toBeInstanceOf(FieldValidationDispatcher);
        expect(valueHostsManager.getMetadata('onValidationStateChanged'))
            .toBeInstanceOf(FormValidationDispatcher);
    });
});

// Registered creators replace the previous factory, and each resulting dispatcher is cached for its manager callback.
describe('DispatcherService dispatcher creator registration', () => {
    test('Uses the replacement creator for all callback categories', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();
        let calls: IDispatcherCall[] = [];
        let created: ReturnType<typeof createDispatcher> = {
            text: { dispatch: () => {} },
            value: { dispatch: () => {} },
            field: { dispatch: () => {} },
            form: { dispatch: () => {} }
        };
        let oldCreatorCalls: string[] = [];
        let newCreatorCalls: string[] = [];

        testItem.registerTextValueChangedDispatcher(() => {
            oldCreatorCalls.push('text');
            return createDispatcher('old-text', calls).text;
        });
        testItem.registerTextValueChangedDispatcher(() => {
            newCreatorCalls.push('text');
            return created.text;
        });
        testItem.registerValueChangedDispatcher(() => {
            oldCreatorCalls.push('value');
            return createDispatcher('old-value', calls).value;
        });
        testItem.registerValueChangedDispatcher(() => {
            newCreatorCalls.push('value');
            return created.value;
        });
        testItem.registerValueHostValidationStateChangedDispatcher(() => {
            oldCreatorCalls.push('field');
            return createDispatcher('old-field', calls).field;
        });
        testItem.registerValueHostValidationStateChangedDispatcher(() => {
            newCreatorCalls.push('field');
            return created.field;
        });
        testItem.registerValidationStateChangedDispatcher(() => {
            oldCreatorCalls.push('form');
            return createDispatcher('old-form', calls).form;
        });
        testItem.registerValidationStateChangedDispatcher(() => {
            newCreatorCalls.push('form');
            return created.form;
        });

        let textDispatcher = testItem.attachTextValueChanged(valueHostsManager);
        let valueDispatcher = testItem.attachValueChanged(valueHostsManager);
        let fieldDispatcher = testItem.attachValueHostValidationStateChanged(valueHostsManager);
        let formDispatcher = testItem.attachValidationStateChanged(valueHostsManager);

        expect(oldCreatorCalls).toEqual([]);
        expect(newCreatorCalls).toEqual(['text', 'value', 'field', 'form']);
        expect(textDispatcher).toBe(created.text);
        expect(valueDispatcher).toBe(created.value);
        expect(fieldDispatcher).toBe(created.field);
        expect(formDispatcher).toBe(created.form);
    });

    test('Returns the same dispatcher without recreating it when a category is attached more than once', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();
        let calls: IDispatcherCall[] = [];
        let creatorCalls = 0;
        let dispatcher = createDispatcher('text', calls).text;
        testItem.registerTextValueChangedDispatcher(() => {
            creatorCalls++;
            return dispatcher;
        });

        let first = testItem.attachTextValueChanged(valueHostsManager);
        let second = testItem.attachTextValueChanged(valueHostsManager);

        expect(first).toBe(dispatcher);
        expect(second).toBe(dispatcher);
        expect(creatorCalls).toBe(1);
    });
});

// The composite attach operation always installs validation callbacks and only opts into value callbacks when requested.
describe('DispatcherService.attach', () => {
    test('Always attaches field and form validation callbacks but leaves optional value callbacks unattached by default', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();

        testItem.attach(valueHostsManager);

        expect(valueHostsManager.onValueHostValidationStateChanged).toBeDefined();
        expect(valueHostsManager.onValidationStateChanged).toBeDefined();
        expect(valueHostsManager.onTextValueChanged).toBeNull();
        expect(valueHostsManager.onValueChanged).toBeNull();
        expect(valueHostsManager.getMetadata('onTextValueChanged')).toBeUndefined();
        expect(valueHostsManager.getMetadata('onValueChanged')).toBeUndefined();
    });

    test('Attaches both optional value callbacks when both flags are true', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();

        testItem.attach(valueHostsManager, true, true);

        expect(valueHostsManager.onTextValueChanged).toBeDefined();
        expect(valueHostsManager.onValueChanged).toBeDefined();
        expect(valueHostsManager.onValueHostValidationStateChanged).toBeDefined();
        expect(valueHostsManager.onValidationStateChanged).toBeDefined();
    });

    test('Does not duplicate callbacks when repeated with the same attachment options', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();
        let calls: IDispatcherCall[] = [];
        let creatorCalls: string[] = [];
        testItem.registerTextValueChangedDispatcher(() => {
            creatorCalls.push('text');
            return createDispatcher('text', calls).text;
        });
        testItem.registerValueChangedDispatcher(() => {
            creatorCalls.push('value');
            return createDispatcher('value', calls).value;
        });
        testItem.registerValueHostValidationStateChangedDispatcher(() => {
            creatorCalls.push('field');
            return createDispatcher('field', calls).field;
        });
        testItem.registerValidationStateChangedDispatcher(() => {
            creatorCalls.push('form');
            return createDispatcher('form', calls).form;
        });

        testItem.attach(valueHostsManager, true, true);
        let callbacks = {
            text: valueHostsManager.onTextValueChanged,
            value: valueHostsManager.onValueChanged,
            field: valueHostsManager.onValueHostValidationStateChanged,
            form: valueHostsManager.onValidationStateChanged
        };
        testItem.attach(valueHostsManager, true, true);

        expect(creatorCalls).toEqual(['field', 'form', 'text', 'value']);
        expect(valueHostsManager.onTextValueChanged).toBe(callbacks.text);
        expect(valueHostsManager.onValueChanged).toBe(callbacks.value);
        expect(valueHostsManager.onValueHostValidationStateChanged).toBe(callbacks.field);
        expect(valueHostsManager.onValidationStateChanged).toBe(callbacks.form);
    });

    test('Retains the optional callback attached by an earlier call when subsequent flags are false', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();
        testItem.attach(valueHostsManager, true, true);
        let textCallback = valueHostsManager.onTextValueChanged;
        let valueCallback = valueHostsManager.onValueChanged;

        testItem.attach(valueHostsManager, false, false);

        expect(valueHostsManager.onTextValueChanged).toBe(textCallback);
        expect(valueHostsManager.onValueChanged).toBe(valueCallback);
    });

    test('Can add optional callbacks when a later call enables them', () => {
        let { testItem } = setup();
        let valueHostsManager = createValueHostsManager();
        testItem.attach(valueHostsManager, false, false);

        testItem.attach(valueHostsManager, true, true);

        expect(valueHostsManager.onTextValueChanged).toBeDefined();
        expect(valueHostsManager.onValueChanged).toBeDefined();
        expect(valueHostsManager.getMetadata('onTextValueChanged')).toBeDefined();
        expect(valueHostsManager.getMetadata('onValueChanged')).toBeDefined();
    });
});

// Each attached manager callback invokes its previous callback first and forwards the event to the matching dispatcher.
describe('DispatcherService callback composition', () => {
    test('Forwards text-value changes and normalizes a null previous text value for the dispatcher', () => {
        let { testItem } = setup();
        let sequence: string[] = [];
        let calls: IDispatcherCall[] = [];
        let dispatcher = createDispatcher('text', calls).text;
        let valueHost = {} as IValidatableValueHost;
        let previousArguments: unknown[] = [];
        testItem.registerTextValueChangedDispatcher(() => dispatcher);
        let valueHostsManager = createValueHostsManager({
            onTextValueChanged: (host, oldTextValue) => {
                sequence.push('previous');
                previousArguments = [host, oldTextValue];
            }
        });
        testItem.attachTextValueChanged(valueHostsManager);
        let attachedDispatcher = valueHostsManager.getMetadata('onTextValueChanged');
        (attachedDispatcher as ITextValueDispatcher).dispatch = (host, oldTextValue) => {
            sequence.push('dispatcher');
            calls.push({ kind: 'text', args: [host, oldTextValue] });
        };

        valueHostsManager.onTextValueChanged!(valueHost, null);

        expect(sequence).toEqual(['previous', 'dispatcher']);
        expect(previousArguments).toEqual([valueHost, null]);
        expect(calls).toEqual([{ kind: 'text', args: [valueHost, undefined] }]);
    });

    test('Forwards native-value changes and preserves the old value', () => {
        let { testItem } = setup();
        let calls: IDispatcherCall[] = [];
        let sequence: string[] = [];
        let dispatcher = createDispatcher('value', calls).value;
        let valueHost = {} as IValueHost;
        let oldValue = { before: 1 };
        let previousArguments: unknown[][] = [];
        testItem.registerValueChangedDispatcher(() => ({
            dispatch: (host, value) => {
                sequence.push('dispatcher');
                dispatcher.dispatch(host, value);
            }
        }));
        let valueHostsManager = createValueHostsManager({
            onValueChanged: (host, value) => {
                sequence.push('previous');
                previousArguments.push([host, value]);
            }
        });
        testItem.attachValueChanged(valueHostsManager);

        valueHostsManager.onValueChanged!(valueHost, oldValue);
        valueHostsManager.onValueChanged!(valueHost, null);

        expect(previousArguments).toEqual([[valueHost, oldValue], [valueHost, null]]);
        expect(sequence).toEqual(['previous', 'dispatcher', 'previous', 'dispatcher']);
        expect(calls).toEqual([
            { kind: 'value', args: [valueHost, oldValue] },
            { kind: 'value', args: [valueHost, null] }
        ]);
    });

    test('Forwards field-validation changes to the prior callback and the field dispatcher', () => {
        let { testItem } = setup();
        let calls: IDispatcherCall[] = [];
        let dispatcher = createDispatcher('field', calls).field;
        let valueHost = {} as IValidatableValueHost;
        let state = {} as ValueHostValidationState;
        let sequence: string[] = [];
        let receivedManagerAsThis = false;
        testItem.registerValueHostValidationStateChangedDispatcher(() => dispatcher);
        let valueHostsManager = createValueHostsManager({
            onValueHostValidationStateChanged: function (host, validationState): void {
                sequence.push('previous');
                receivedManagerAsThis = this === valueHostsManager;
                expect(host).toBe(valueHost);
                expect(validationState).toBe(state);
            }
        });
        testItem.attachValueHostValidationStateChanged(valueHostsManager);
        (valueHostsManager.getMetadata('onValueHostValidationStateChanged') as IFieldValidationDispatcher)
            .dispatch = (host, validationState) => {
                sequence.push('dispatcher');
                calls.push({ kind: 'field', args: [host, validationState] });
            };

        valueHostsManager.onValueHostValidationStateChanged!(valueHost, state);

        expect(sequence).toEqual(['previous', 'dispatcher']);
        expect(receivedManagerAsThis).toBe(true);
        expect(calls).toEqual([{ kind: 'field', args: [valueHost, state] }]);
    });

    test('Forwards form-validation changes to the prior callback and the form dispatcher', () => {
        let { testItem } = setup();
        let calls: IDispatcherCall[] = [];
        let dispatcher = createDispatcher('form', calls).form;
        let state = {} as ValidationState;
        let sequence: string[] = [];
        let receivedManagerAsThis = false;
        testItem.registerValidationStateChangedDispatcher(() => dispatcher);
        let valueHostsManager = createValueHostsManager({
            onValidationStateChanged: function (manager, validationState): void {
                sequence.push('previous');
                receivedManagerAsThis = this === valueHostsManager;
                expect(manager).toBe(valueHostsManager);
                expect(validationState).toBe(state);
            }
        });
        testItem.attachValidationStateChanged(valueHostsManager);
        (valueHostsManager.getMetadata('onValidationStateChanged') as IFormValidationDispatcher)
            .dispatch = (manager, validationState) => {
                sequence.push('dispatcher');
                calls.push({ kind: 'form', args: [manager, validationState] });
            };

        valueHostsManager.onValidationStateChanged!(valueHostsManager, state);

        expect(sequence).toEqual(['previous', 'dispatcher']);
        expect(receivedManagerAsThis).toBe(true);
        expect(calls).toEqual([{ kind: 'form', args: [valueHostsManager, state] }]);
    });

    test('Does not dispatch if the previous callback throws', () => {
        let { testItem } = setup();
        let calls: IDispatcherCall[] = [];
        let error = new Error('Previous callback failed');
        testItem.registerTextValueChangedDispatcher(() => createDispatcher('text', calls).text);
        let valueHostsManager = createValueHostsManager({
            onTextValueChanged: () => {
                throw error;
            }
        });
        testItem.attachTextValueChanged(valueHostsManager);

        expect(() => valueHostsManager.onTextValueChanged!({} as IValidatableValueHost, 'old'))
            .toThrow(error);
        expect(calls).toEqual([]);
    });

    test('Preserves the calling receiver for the previously installed callback', () => {
        let { testItem } = setup();
        let receivedManagerAsThis = false;
        testItem.registerTextValueChangedDispatcher(() => ({
            dispatch: () => {}
        }));
        let valueHostsManager = createValueHostsManager({
            onTextValueChanged: function (): void {
                receivedManagerAsThis = this === valueHostsManager;
            }
        });
        testItem.attachTextValueChanged(valueHostsManager);

        valueHostsManager.onTextValueChanged!({} as IValidatableValueHost, 'old');

        expect(receivedManagerAsThis).toBe(true);
    });
});
