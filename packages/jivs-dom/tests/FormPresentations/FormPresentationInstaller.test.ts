/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IFormPresentation } from '../../src/Interfaces/FormPresentations';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import { ElementRole } from '../../src/Interfaces/Types';
import { FormPresentationInstaller } from '../../src/FormPresentations/FormPresentationInstaller';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ICreateCall
{
    element: IJivsElement;
    role: ElementRole | string;
    presentationName?: string | null;
}

class RecordingFormPresentation implements IFormPresentation
{
    public events: string[] = [];
    public initCalls: IValueHostsManager[] = [];
    public applyCalls: { manager: IValueHostsManager, state: ValidationState }[] = [];
    public throwOnInit = false;
    public throwOnApply = false;

    public init(valueHostsManager: IValueHostsManager): void
    {
        this.events.push('init');
        this.initCalls.push(valueHostsManager);
        if (this.throwOnInit)
            throw new Error('init failed');
    }

    public apply(valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        this.events.push('apply');
        this.applyCalls.push({ manager: valueHostsManager, state: state });
        if (this.throwOnApply)
            throw new Error('apply failed');
    }

    public getStaticAriaUpdater(): null
    {
        return null;
    }
}

class RecordingFormPresentationFactory implements IPresentationFactory<IFormPresentation>
{
    public createCalls: ICreateCall[] = [];

    constructor(public result: IFormPresentation)
    {
    }

    public register(): void { throw new Error('Not used by this test.'); }
    public lazyRegistration(): void { throw new Error('Not used by this test.'); }
    public setDefaultPresentationName(): void { throw new Error('Not used by this test.'); }

    public create(element: IJivsElement, role: ElementRole | string,
        presentationName?: string | null): IFormPresentation
    {
        this.createCalls.push({ element: element, role: role, presentationName: presentationName });
        return this.result;
    }
}

// Records the options passed to currentValidationState so tests can verify the group pass-through.
class RecordingManager
{
    public stateRequests: any[] = [];
    public stateToReturn = { issuesFound: null } as unknown as ValidationState;

    public currentValidationState(options?: any): ValidationState
    {
        this.stateRequests.push(options);
        return this.stateToReturn;
    }
}

function setup()
{
    let presentation = new RecordingFormPresentation();
    let factory = new RecordingFormPresentationFactory(presentation);
    let domServices = createMockJivsDomServices({ formPresentationFactory: factory });
    let manager = new RecordingManager();
    return {
        presentation: presentation,
        factory: factory,
        manager: manager,
        valueHostsManager: manager as unknown as IValueHostsManager,
        installer: new FormPresentationInstaller(domServices),
        element: document.createElement('form') as unknown as IJivsElement
    };
}

// Installation validates its required parameters before doing anything.
describe('FormPresentationInstaller.install validation', () => {
    test('Rejects null or undefined valueHostsManager, element, and role', () => {
        let { installer, element, valueHostsManager, factory } = setup();

        expect(() => installer.install(null as unknown as IValueHostsManager, element, ElementRole.summary))
            .toThrow(new CodingError('valueHostsManager required'));
        expect(() => installer.install(undefined as unknown as IValueHostsManager, element, ElementRole.summary))
            .toThrow(new CodingError('valueHostsManager required'));
        expect(() => installer.install(valueHostsManager, null as unknown as IJivsElement, ElementRole.summary))
            .toThrow(new CodingError('element required'));
        expect(() => installer.install(valueHostsManager, element, null as unknown as string))
            .toThrow(new CodingError('role required'));
        expect(() => installer.install(valueHostsManager, element, undefined as unknown as string))
            .toThrow(new CodingError('role required'));
        expect(factory.createCalls).toEqual([]);
    });
});

// A fresh element goes through create, init, apply, then assignment of the presentation and group.
describe('FormPresentationInstaller.install new element', () => {
    test('Creates with role and name, runs init before apply, and assigns the element properties', () => {
        let { installer, element, valueHostsManager, factory, presentation, manager } = setup();

        let result = installer.install(valueHostsManager, element, ElementRole.summary,
            { presentationName: 'Custom', group: 'G1' });

        expect(result).toBe(presentation);
        expect(factory.createCalls).toEqual([{ element: element, role: ElementRole.summary, presentationName: 'Custom' }]);
        expect(presentation.events).toEqual(['init', 'apply']);
        expect(presentation.initCalls).toEqual([valueHostsManager]);
        expect(presentation.applyCalls.length).toBe(1);
        expect(presentation.applyCalls[0].manager).toBe(valueHostsManager);
        expect(presentation.applyCalls[0].state).toBe(manager.stateToReturn);
        expect(manager.stateRequests).toEqual([{ group: 'G1' }]);
        expect(element.jivsFormPresentation).toBe(presentation);
        expect(element.jivsFormPresentationGroup).toBe('G1');
        expect(element.jivsElementRole).toBe(ElementRole.summary);
    });

    test('Without options, uses the default presentation name and no group', () => {
        let { installer, element, valueHostsManager, factory, manager } = setup();

        installer.install(valueHostsManager, element, 'customRole');

        expect(factory.createCalls[0].role).toBe('customRole');
        expect(factory.createCalls[0].presentationName).toBeUndefined();
        expect(manager.stateRequests).toEqual([{ group: undefined }]);
        expect(element.jivsFormPresentationGroup).toBeUndefined();
        expect(element.jivsElementRole).toBe('customRole');
    });

    test('Accepts a null presentationName', () => {
        let { installer, element, valueHostsManager, factory } = setup();

        installer.install(valueHostsManager, element, ElementRole.summary, { presentationName: null });

        expect(factory.createCalls[0].presentationName).toBeNull();
    });
});

// Elements that already have a presentation are returned untouched.
describe('FormPresentationInstaller.install already installed', () => {
    test('Returns the existing presentation without creating, initializing, or changing properties', () => {
        let { installer, element, valueHostsManager, factory, presentation, manager } = setup();
        let existing = new RecordingFormPresentation();
        element.jivsFormPresentation = existing;
        element.jivsFormPresentationGroup = 'Old';
        element.jivsElementRole = 'oldRole';

        let result = installer.install(valueHostsManager, element, ElementRole.summary, { group: 'New' });

        expect(result).toBe(existing);
        expect(factory.createCalls).toEqual([]);
        expect(presentation.events).toEqual([]);
        expect(existing.events).toEqual([]);
        expect(manager.stateRequests).toEqual([]);
        expect(element.jivsFormPresentationGroup).toBe('Old');
        expect(element.jivsElementRole).toBe('oldRole');
    });

    test('Calling install twice only creates once and returns the same presentation', () => {
        let { installer, element, valueHostsManager, factory } = setup();

        let first = installer.install(valueHostsManager, element, ElementRole.summary);
        let second = installer.install(valueHostsManager, element, ElementRole.summary);

        expect(second).toBe(first);
        expect(factory.createCalls.length).toBe(1);
    });

    test('A null jivsFormPresentation is treated as installed (not undefined)', () => {
        let { installer, element, valueHostsManager, factory } = setup();
        element.jivsFormPresentation = null as unknown as IFormPresentation;

        expect(installer.install(valueHostsManager, element, ElementRole.summary)).toBeNull();
        expect(factory.createCalls).toEqual([]);
    });
});

// Failures in the factory or presentation propagate and leave the element unassigned.
describe('FormPresentationInstaller.install failures', () => {
    test('init failure propagates, skips apply, and does not assign the presentation', () => {
        let { installer, element, valueHostsManager, presentation } = setup();
        presentation.throwOnInit = true;

        expect(() => installer.install(valueHostsManager, element, ElementRole.summary, { group: 'G' }))
            .toThrow('init failed');
        expect(presentation.events).toEqual(['init']);
        expect(element.jivsFormPresentation).toBeUndefined();
        expect(element.jivsFormPresentationGroup).toBeUndefined();
    });

    test('apply failure propagates and does not assign the presentation', () => {
        let { installer, element, valueHostsManager, presentation } = setup();
        presentation.throwOnApply = true;

        expect(() => installer.install(valueHostsManager, element, ElementRole.summary))
            .toThrow('apply failed');
        expect(element.jivsFormPresentation).toBeUndefined();
    });

    test('Factory failure propagates and does not assign the presentation', () => {
        let { installer, element, valueHostsManager, factory } = setup();
        factory.create = () => { throw new Error('no such presentation'); };

        expect(() => installer.install(valueHostsManager, element, ElementRole.summary))
            .toThrow('no such presentation');
        expect(element.jivsFormPresentation).toBeUndefined();
    });
});
