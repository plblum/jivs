/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type {
    FieldPresentationInstallOptions,
    IFieldPresentation
} from '../../src/Interfaces/FieldPresentations';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import { ElementRole } from '../../src/Interfaces/Types';
import { FieldPresentationInstaller } from '../../src/FieldPresentations/FieldPresentationInstaller';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ICreateCall
{
    element: IJivsElement;
    role: ElementRole | string;
    presentationName?: string | null;
}

interface IApplyCall
{
    valueHost: IFieldValueHost;
    state: ValueHostValidationState;
}

class RecordingFieldPresentation implements IFieldPresentation
{
    public initCalls: IValueHostsManager[] = [];
    public applyCalls: IApplyCall[] = [];

    public init(valueHostsManager: IValueHostsManager): void
    {
        this.initCalls.push(valueHostsManager);
    }

    public apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        this.applyCalls.push({ valueHost: valueHost, state: state });
    }

    public getStaticAriaUpdater(): null
    {
        return null;
    }

    public getAriaValidationStateUpdater(): null
    {
        return null;
    }

    public dispose(): void
    {
    }
}

class RecordingFieldPresentationFactory implements IPresentationFactory<IFieldPresentation>
{
    public createCalls: ICreateCall[] = [];
    public result: IFieldPresentation;

    constructor(result: IFieldPresentation)
    {
        this.result = result;
    }

    public register(): void { throw new Error('Not used by this test.'); }
    public lazyRegistration(): void { throw new Error('Not used by this test.'); }
    public setDefaultPresentationName(): void { throw new Error('Not used by this test.'); }

    public create(
        element: IJivsElement,
        role: ElementRole | string,
        presentationName?: string | null
    ): IFieldPresentation
    {
        this.createCalls.push({
            element: element,
            role: role,
            presentationName: presentationName
        });
        return this.result;
    }
}

interface ISetup
{
    domServices: IJivsDomServices;
    factory: RecordingFieldPresentationFactory;
    installer: FieldPresentationInstaller;
    presentation: RecordingFieldPresentation;
    valueHost: IFieldValueHost;
    valueHostsManager: IValueHostsManager;
    currentValidationState: ValueHostValidationState;
    element: IJivsElement;
}

function setup(): ISetup
{
    let presentation = new RecordingFieldPresentation();
    let factory = new RecordingFieldPresentationFactory(presentation);
    let domServices = createMockJivsDomServices({
        fieldPresentationFactory: factory,
        getInstallCounter: () => 4
    });
    let valueHostsManager = {} as IValueHostsManager;
    let currentValidationState = {} as ValueHostValidationState;
    let valueHost = {
        valueHostsManager: valueHostsManager,
        currentValidationState: currentValidationState
    } as IFieldValueHost;
    return {
        domServices: domServices,
        factory: factory,
        installer: new FieldPresentationInstaller(domServices),
        presentation: presentation,
        valueHost: valueHost,
        valueHostsManager: valueHostsManager,
        currentValidationState: currentValidationState,
        element: document.createElement('div')
    };
}

// Installation validates required inputs and passes role and options through to the presentation factory.
describe('FieldPresentationInstaller.install validation and creation', () => {
    test('Rejects null or undefined value hosts, elements, and roles', () => {
        let { installer, element, valueHost } = setup();

        expect(() => installer.install(null as unknown as IFieldValueHost, element, ElementRole.editor))
            .toThrow(new CodingError('valueHost required'));
        expect(() => installer.install(undefined as unknown as IFieldValueHost, element, ElementRole.editor))
            .toThrow(new CodingError('valueHost required'));
        expect(() => installer.install(valueHost, null as unknown as IJivsElement, ElementRole.editor))
            .toThrow(new CodingError('element required'));
        expect(() => installer.install(valueHost, undefined as unknown as IJivsElement, ElementRole.editor))
            .toThrow(new CodingError('element required'));
        expect(() => installer.install(valueHost, element, null as unknown as ElementRole))
            .toThrow(new CodingError('role required'));
        expect(() => installer.install(valueHost, element, undefined as unknown as ElementRole))
            .toThrow(new CodingError('role required'));
    });

    test('Creates, initializes, applies, and stores the presentation in lifecycle order', () => {
        let { installer, factory, presentation, valueHost, valueHostsManager, currentValidationState, element } = setup();
        let lifecycle: string[] = [];
        presentation.init = manager => {
            lifecycle.push('init');
            presentation.initCalls.push(manager);
        };
        presentation.apply = (host, state) => {
            lifecycle.push('apply');
            presentation.applyCalls.push({ valueHost: host, state: state });
        };

        let result = installer.install(valueHost, element, ElementRole.editor);

        expect(factory.createCalls).toEqual([{
            element: element,
            role: ElementRole.editor,
            presentationName: undefined
        }]);
        expect(element.jivsElementRole).toBe(ElementRole.editor);
        expect(presentation.initCalls).toEqual([valueHostsManager]);
        expect(presentation.applyCalls).toEqual([{
            valueHost: valueHost,
            state: currentValidationState
        }]);
        expect(lifecycle).toEqual(['init', 'apply']);
        expect(element.jivsFieldPresentation).toBe(presentation);
        expect(result).toBe(presentation);
    });

    test('Stamps the element with the current installer counter when a presentation is created', () => {
        let { installer, valueHost, element } = setup();

        installer.install(valueHost, element, ElementRole.error);

        expect(element.jivsInstallCounter).toBe(4);
    });

    test('Does not stamp the counter on an element that already has a presentation', () => {
        let { installer, valueHost, element } = setup();
        element.jivsFieldPresentation = new RecordingFieldPresentation();
        element.jivsInstallCounter = 2;

        installer.install(valueHost, element, ElementRole.error);

        expect(element.jivsInstallCounter).toBe(2);
    });

    test('Does not stamp the counter when initialization throws', () => {
        let { installer, presentation, valueHost, element } = setup();
        presentation.init = () => { throw new Error('Initialization failed'); };

        expect(() => installer.install(valueHost, element, ElementRole.editor)).toThrow('Initialization failed');

        expect(element.jivsInstallCounter).toBeUndefined();
    });

    test('Passes a custom role and explicit presentation name to the factory', () => {
        let { installer, factory, valueHost, element } = setup();
        let options: FieldPresentationInstallOptions = { presentationName: 'custom-field' };

        installer.install(valueHost, element, 'custom-role', options);

        expect(factory.createCalls).toEqual([{
            element: element,
            role: 'custom-role',
            presentationName: 'custom-field'
        }]);
    });

    test('Treats null options as omitted options and preserves an explicit null presentation name', () => {
        let first = setup();
        first.installer.install(first.valueHost, first.element, ElementRole.editor, null as unknown as FieldPresentationInstallOptions);
        expect(first.factory.createCalls[0].presentationName).toBeUndefined();

        let second = setup();
        second.installer.install(second.valueHost, second.element, ElementRole.editor, { presentationName: null });
        expect(second.factory.createCalls[0].presentationName).toBeNull();
    });
});

// Existing or intentionally disabled presentations are preserved instead of being initialized twice.
describe('FieldPresentationInstaller.install existing presentation', () => {
    test('Does not recreate a presentation when the same element is installed again', () => {
        let { installer, factory, presentation, valueHost, element } = setup();
        let firstResult = installer.install(valueHost, element, ElementRole.editor);

        let secondResult = installer.install(valueHost, element, 'different-role', {
            presentationName: 'different-presentation'
        });

        expect(secondResult).toBe(firstResult);
        expect(secondResult).toBe(presentation);
        expect(element.jivsElementRole).toBe(ElementRole.editor);
        expect(factory.createCalls).toHaveLength(1);
        expect(presentation.initCalls).toHaveLength(1);
        expect(presentation.applyCalls).toHaveLength(1);
    });

    test('Returns an existing presentation without modifying the element or invoking collaborators', () => {
        let { installer, factory, presentation, valueHost, element } = setup();
        let existingPresentation = new RecordingFieldPresentation();
        element.jivsFieldPresentation = existingPresentation;
        element.jivsElementRole = 'existing-role';

        let result = installer.install(valueHost, element, ElementRole.editor, { presentationName: 'ignored' });

        expect(result).toBe(existingPresentation);
        expect(element.jivsElementRole).toBe('existing-role');
        expect(factory.createCalls).toHaveLength(0);
        expect(presentation.initCalls).toHaveLength(0);
        expect(presentation.applyCalls).toHaveLength(0);
    });

    test('Preserves an explicit null presentation marker and does not create a presentation', () => {
        let { installer, factory, valueHost, element } = setup();
        element.jivsFieldPresentation = null;

        let result = installer.install(valueHost, element, ElementRole.editor);

        expect(result).toBeNull();
        expect(factory.createCalls).toHaveLength(0);
        expect(element.jivsElementRole).toBeUndefined();
    });
});

// The element is marked installed only after initialization and initial validation state have been applied.
describe('FieldPresentationInstaller.install failures', () => {
    test('Does not assign the presentation if initialization throws', () => {
        let { installer, presentation, valueHost, element } = setup();
        let failure = new Error('Initialization failed');
        presentation.init = () => { throw failure; };

        expect(() => installer.install(valueHost, element, ElementRole.editor)).toThrow(failure);

        expect(element.jivsElementRole).toBe(ElementRole.editor);
        expect(element.jivsFieldPresentation).toBeUndefined();
        expect(presentation.applyCalls).toHaveLength(0);
    });

    test('Does not assign the presentation if applying the current state throws', () => {
        let { installer, presentation, valueHost, element } = setup();
        let failure = new Error('Initial apply failed');
        presentation.apply = () => { throw failure; };

        expect(() => installer.install(valueHost, element, ElementRole.editor)).toThrow(failure);

        expect(element.jivsElementRole).toBe(ElementRole.editor);
        expect(element.jivsFieldPresentation).toBeUndefined();
        expect(presentation.initCalls).toHaveLength(1);
    });
});
