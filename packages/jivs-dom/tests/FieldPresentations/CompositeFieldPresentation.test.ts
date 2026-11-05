/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../../src/Interfaces/AriaUpdaters';
import type { IFieldPresentation } from '../../src/Interfaces/FieldPresentations';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import { CompositeFieldPresentation } from '../../src/FieldPresentations/CompositeFieldPresentation';
import { ElementRole } from '../../src/Interfaces/Types';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

type PresentationOperation =
    'init' | 'apply' | 'getStaticAriaUpdater' | 'getAriaValidationStateUpdater' | 'dispose';

interface IFactoryCreateCall
{
    element: IJivsElement;
    role: ElementRole | string;
    name?: string | null;
}

class RecordingPresentationFactory implements IPresentationFactory<IFieldPresentation>
{
    public createCalls: IFactoryCreateCall[] = [];
    public presentations = new Map<string, IFieldPresentation>();

    public register(): void { throw new Error('Not used by this test.'); }
    public lazyRegistration(): void { throw new Error('Not used by this test.'); }
    public setDefaultPresentationName(): void { throw new Error('Not used by this test.'); }

    public create(
        element: IJivsElement,
        role: ElementRole | string,
        name?: string | null
    ): IFieldPresentation | null
    {
        this.createCalls.push({ element: element, role: role, name: name });
        return name ? this.presentations.get(name) ?? null : null;
    }
}

class RecordingFieldPresentation implements IFieldPresentation
{
    public initCalls: IValueHostsManager[] = [];
    public applyCalls: Array<{
        valueHost: IFieldValueHost;
        state: ValueHostValidationState;
    }> = [];
    public disposeCalls: number = 0;
    public staticAriaUpdater: IAriaStaticUpdater | null = null;
    public ariaValidationStateUpdater: IAriaValidationStateUpdater | null = null;
    public failures = new Map<PresentationOperation, unknown>();

    public init(valueHostsManager: IValueHostsManager): void
    {
        this.initCalls.push(valueHostsManager);
        this.throwIfConfigured('init');
    }

    public apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        this.applyCalls.push({ valueHost: valueHost, state: state });
        this.throwIfConfigured('apply');
    }

    public getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        this.throwIfConfigured('getStaticAriaUpdater');
        return this.staticAriaUpdater;
    }

    public getAriaValidationStateUpdater(): IAriaValidationStateUpdater | null
    {
        this.throwIfConfigured('getAriaValidationStateUpdater');
        return this.ariaValidationStateUpdater;
    }

    public dispose(): void
    {
        this.disposeCalls++;
        this.throwIfConfigured('dispose');
    }

    private throwIfConfigured(operation: PresentationOperation): void
    {
        if (this.failures.has(operation))
            throw this.failures.get(operation);
    }
}

interface ISetup
{
    composite: CompositeFieldPresentation;
    element: IJivsElement;
    factory: RecordingPresentationFactory;
    domServices: IJivsDomServices;
    loggingService: RecordingLoggingService | null;
    valueHostsManager: IValueHostsManager;
    valueHost: IFieldValueHost;
    first: RecordingFieldPresentation;
    second: RecordingFieldPresentation;
}

/**
 * Creates a presentation and its collaborators for isolated child-presentation tests.
 * @param childNames The ordered registered names used to create children; defaults to two children.
 * @param loggingEnabled Whether to include a recording logging service; defaults to true.
 */
function setup(
    childNames: string[] = ['first', 'second'],
    loggingEnabled: boolean = true
): ISetup
{
    let element = document.createElement('div') as IJivsElement;
    element.id = 'email-error';
    element.jivsElementRole = ElementRole.error;
    let factory = new RecordingPresentationFactory();
    let first = new RecordingFieldPresentation();
    let second = new RecordingFieldPresentation();
    factory.presentations.set('first', first);
    factory.presentations.set('second', second);
    let loggingService = loggingEnabled ? new RecordingLoggingService() : null;
    let services = { loggingService: loggingService } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({
        services: services,
        fieldPresentationFactory: factory
    });
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    let valueHost = createStubFieldValueHost('Email', 'email');
    let composite = new CompositeFieldPresentation(element, childNames);

    return {
        composite: composite,
        element: element,
        factory: factory,
        domServices: domServices,
        loggingService: loggingService,
        valueHostsManager: valueHostsManager,
        valueHost: valueHost,
        first: first,
        second: second
    };
}

function initialize(testData: ISetup): void
{
    testData.composite.init(testData.valueHostsManager);
}

function apply(testData: ISetup): ValueHostValidationState
{
    let state = { isValid: false } as ValueHostValidationState;
    testData.composite.apply(testData.valueHost, state);
    return state;
}

// Required constructor inputs are rejected immediately so a malformed composite cannot be installed.
describe('CompositeFieldPresentation.constructor', () => {
    test('Rejects a null element or child-name list', () => {
        let element = document.createElement('div') as IJivsElement;

        expect(() => new CompositeFieldPresentation(null as unknown as IJivsElement, ['first'])).toThrow(/element/);
        expect(() => new CompositeFieldPresentation(element, null as unknown as string[])).toThrow(/childPresentationNames/);
    });
});

// Named children are created for the same element and initialized in configuration order.
describe('CompositeFieldPresentation.init', () => {
    test('Creates named children through the factory and initializes them in order', () => {
        let testData = setup(['second', 'first']);

        initialize(testData);

        expect(testData.factory.createCalls).toEqual([
            { element: testData.element, role: ElementRole.error, name: 'second' },
            { element: testData.element, role: ElementRole.error, name: 'first' }
        ]);
        expect(testData.second.initCalls).toEqual([testData.valueHostsManager]);
        expect(testData.first.initCalls).toEqual([testData.valueHostsManager]);
    });

    test('Uses the error role when the element has no role assigned', () => {
        let testData = setup();
        testData.element.jivsElementRole = undefined;

        initialize(testData);

        expect(testData.factory.createCalls[0].role).toBe(ElementRole.error);
    });

    test('Rejects a null manager or a manager without DOM services', () => {
        let testData = setup();
        expect(() => testData.composite.init(null as unknown as IValueHostsManager)).toThrow(/valueHostsManager/);

        let managerWithoutDomServices = {
            services: { domServices: null }
        } as unknown as IValueHostsManager;
        expect(() => testData.composite.init(managerWithoutDomServices)).toThrow(/domServices/);
    });

    test('Initializes only once even when init is called again', () => {
        let testData = setup();

        initialize(testData);
        initialize(testData);

        expect(testData.factory.createCalls).toHaveLength(2);
        expect(testData.first.initCalls).toHaveLength(1);
        expect(testData.second.initCalls).toHaveLength(1);
    });

    test('Throws when a child name is empty or no child names were supplied', () => {
        let emptyName = setup(['first', ' ']);
        expect(() => initialize(emptyName)).toThrow(
            'CompositeFieldPresentation child presentation names must not be empty.');
        expect(emptyName.factory.createCalls).toHaveLength(1);

        let noChildren = setup([]);
        expect(() => initialize(noChildren)).toThrow(
            'CompositeFieldPresentation requires at least one child presentation name.');
        expect(noChildren.factory.createCalls).toHaveLength(0);
    });

    test('Throws for an unregistered child and disposes any children already created', () => {
        let testData = setup(['first', 'missing']);

        expect(() => initialize(testData)).toThrow(
            'No field presentation was created for child name "missing".');

        expect(testData.factory.createCalls).toHaveLength(2);
        expect(testData.first.disposeCalls).toBe(1);
        expect(testData.second.initCalls).toHaveLength(0);
    });

    test('Continues initializing after a child fails and logs the failed child', () => {
        let testData = setup();
        testData.first.failures.set('init', new Error('init failed'));

        initialize(testData);
        apply(testData);

        expect(testData.second.initCalls).toEqual([testData.valueHostsManager]);
        expect(testData.first.applyCalls).toHaveLength(0);
        expect(testData.second.applyCalls).toHaveLength(1);
        expect(testData.loggingService?.calls).toEqual([{
            level: LoggingLevel.Error,
            details: {
                message: 'CompositeFieldPresentation could not init child "first": init failed',
                feature: 'Dom',
                type: 'CompositeFieldPresentation',
                identity: 'first',
                data: { idAttribute: 'email-error' }
            }
        }]);
    });
});

// Validation state is forwarded to every successfully initialized child without allowing one failure to block the rest.
describe('CompositeFieldPresentation.apply', () => {
    test('Passes the same value host and validation state to children in order', () => {
        let testData = setup();
        initialize(testData);
        let state = apply(testData);

        expect(testData.first.applyCalls).toEqual([{ valueHost: testData.valueHost, state: state }]);
        expect(testData.second.applyCalls).toEqual([{ valueHost: testData.valueHost, state: state }]);
    });

    test('Logs a child failure and still applies to later children', () => {
        let testData = setup();
        initialize(testData);
        testData.first.failures.set('apply', 'apply failed');
        let state = apply(testData);

        expect(testData.first.applyCalls).toEqual([{ valueHost: testData.valueHost, state: state }]);
        expect(testData.second.applyCalls).toEqual([{ valueHost: testData.valueHost, state: state }]);
        expect(testData.loggingService?.calls).toEqual([{
            level: LoggingLevel.Error,
            details: {
                message: 'CompositeFieldPresentation could not apply child "first": apply failed',
                feature: 'Dom',
                type: 'CompositeFieldPresentation',
                identity: 'first',
                data: { idAttribute: 'email-error', valueHostName: 'Email' }
            }
        }]);
    });

    test('Requires initialization before applying and rejects use after disposal', () => {
        let testData = setup();

        expect(() => apply(testData)).toThrow(
            'CompositeFieldPresentation must be initialized before use.');

        initialize(testData);
        testData.composite.dispose();

        expect(() => apply(testData)).toThrow();
        expect(() => initialize(testData)).toThrow('CompositeFieldPresentation is disposed.');
    });

    test('Rejects a null value host', () => {
        let testData = setup();
        initialize(testData);
        let state = { isValid: false } as ValueHostValidationState;

        expect(() => testData.composite.apply(null as unknown as IFieldValueHost, state)).toThrow(/valueHost/);
    });

    test('Continues after child failures when no logging service is configured', () => {
        let testData = setup(['first', 'second'], false);
        initialize(testData);
        testData.first.failures.set('apply', new Error('apply failed'));

        expect(() => apply(testData)).not.toThrow();
        expect(testData.second.applyCalls).toHaveLength(1);
        expect(testData.loggingService).toBeNull();
    });
});

// ARIA updater selection is deterministic: the first initialized child that provides one wins.
describe('CompositeFieldPresentation ARIA updaters', () => {
    test('Returns null when updater queries occur before initialization', () => {
        let testData = setup();

        expect(testData.composite.getStaticAriaUpdater()).toBeNull();
        expect(testData.composite.getAriaValidationStateUpdater()).toBeNull();
    });

    test('Returns the first static and validation-state updater supplied by children', () => {
        let testData = setup();
        let firstStaticUpdater = {} as IAriaStaticUpdater;
        let secondStaticUpdater = {} as IAriaStaticUpdater;
        let secondValidationUpdater = {} as IAriaValidationStateUpdater;
        testData.first.staticAriaUpdater = firstStaticUpdater;
        testData.second.staticAriaUpdater = secondStaticUpdater;
        testData.second.ariaValidationStateUpdater = secondValidationUpdater;
        initialize(testData);

        expect(testData.composite.getStaticAriaUpdater()).toBe(firstStaticUpdater);
        expect(testData.composite.getAriaValidationStateUpdater()).toBe(secondValidationUpdater);
    });

    test('Logs an updater failure and continues searching later children', () => {
        let testData = setup();
        let updater = {} as IAriaStaticUpdater;
        testData.first.failures.set('getStaticAriaUpdater', new Error('updater failed'));
        testData.first.failures.set('getAriaValidationStateUpdater', new Error('state updater failed'));
        testData.second.staticAriaUpdater = updater;
        initialize(testData);

        expect(testData.composite.getStaticAriaUpdater()).toBe(updater);
        expect(testData.composite.getAriaValidationStateUpdater()).toBeNull();
        expect(testData.loggingService?.calls).toEqual([
            {
                level: LoggingLevel.Error,
                details: {
                    message: 'CompositeFieldPresentation could not getStaticAriaUpdater child "first": updater failed',
                    feature: 'Dom',
                    type: 'CompositeFieldPresentation',
                    identity: 'first',
                    data: { idAttribute: 'email-error' }
                }
            },
            {
                level: LoggingLevel.Error,
                details: {
                    message: 'CompositeFieldPresentation could not getAriaValidationStateUpdater child "first": state updater failed',
                    feature: 'Dom',
                    type: 'CompositeFieldPresentation',
                    identity: 'first',
                    data: { idAttribute: 'email-error' }
                }
            }
        ]);
    });

    test('Skips children that failed initialization when selecting ARIA updaters', () => {
        let testData = setup();
        let staticUpdater = {} as IAriaStaticUpdater;
        let validationUpdater = {} as IAriaValidationStateUpdater;
        testData.first.failures.set('init', new Error('init failed'));
        testData.first.staticAriaUpdater = {} as IAriaStaticUpdater;
        testData.first.ariaValidationStateUpdater = {} as IAriaValidationStateUpdater;
        testData.second.staticAriaUpdater = staticUpdater;
        testData.second.ariaValidationStateUpdater = validationUpdater;
        initialize(testData);

        expect(testData.composite.getStaticAriaUpdater()).toBe(staticUpdater);
        expect(testData.composite.getAriaValidationStateUpdater()).toBe(validationUpdater);
        expect(testData.loggingService?.calls).toEqual([{
            level: LoggingLevel.Error,
            details: {
                message: 'CompositeFieldPresentation could not init child "first": init failed',
                feature: 'Dom',
                type: 'CompositeFieldPresentation',
                identity: 'first',
                data: { idAttribute: 'email-error' }
            }
        }]);
    });

    test('Returns null when no children provide an updater', () => {
        let testData = setup();
        initialize(testData);

        expect(testData.composite.getStaticAriaUpdater()).toBeNull();
        expect(testData.composite.getAriaValidationStateUpdater()).toBeNull();
    });
});

// Disposal attempts every child, logs failures, and releases its child references.
describe('CompositeFieldPresentation.dispose', () => {
    test('Disposes all children even when one throws and can be called repeatedly', () => {
        let testData = setup();
        initialize(testData);
        testData.first.failures.set('dispose', new Error('dispose failed'));

        expect(() => testData.composite.dispose()).not.toThrow();
        expect(testData.first.disposeCalls).toBe(1);
        expect(testData.second.disposeCalls).toBe(1);
        expect(testData.loggingService?.calls).toEqual([{
            level: LoggingLevel.Error,
            details: {
                message: 'CompositeFieldPresentation could not dispose child "first": dispose failed',
                feature: 'Dom',
                type: 'CompositeFieldPresentation',
                identity: 'first',
                data: { idAttribute: 'email-error' }
            }
        }]);

        testData.composite.dispose();

        expect(testData.first.disposeCalls).toBe(1);
        expect(testData.second.disposeCalls).toBe(1);
    });

    test('Disposes children when a later child name cannot be resolved', () => {
        let testData = setup(['first', 'missing']);

        expect(() => initialize(testData)).toThrow();
        expect(testData.first.disposeCalls).toBe(1);
    });
});
