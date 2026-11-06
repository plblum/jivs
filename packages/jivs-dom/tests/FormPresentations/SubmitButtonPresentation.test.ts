/** @jest-environment jsdom */
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { SubmitButtonPresentation } from '../../src/FormPresentations/SubmitButtonPresentation';
import type { SubmitButtonPresentationOptions } from '../../src/FormPresentations/SubmitButtonPresentation';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingLoggingService } from '../TestSupport/mocks';

interface ISetup
{
    domServices: IJivsDomServices;
    element: HTMLElement;
    loggingService: RecordingLoggingService | null;
    presentation: SubmitButtonPresentation;
    valueHostsManager: IValueHostsManager;
    currentStateRequests: Array<{ group?: string }>;
}

function createState(doNotSave: boolean, group?: string | null): ValidationState
{
    return {
        isValid: !doNotSave,
        doNotSave: doNotSave,
        issuesFound: null,
        asyncProcessing: false,
        group: group
    } as ValidationState;
}

interface ISetupParameters
{
    element?: HTMLElement;
    options?: SubmitButtonPresentationOptions;
    globalOptions?: SubmitButtonPresentationOptions;
    presentationGroup?: string;
    loggingEnabled?: boolean;
    // What the manager returns from currentValidationState(); used for the wildcard routing case.
    currentState?: ValidationState;
}

function setup(parameters: ISetupParameters = {}): ISetup
{
    let element = parameters.element ?? document.createElement('button');
    if (parameters.presentationGroup !== undefined)
        (element as IJivsElement).jivsFormPresentationGroup = parameters.presentationGroup;
    let loggingService = parameters.loggingEnabled === false ? null : new RecordingLoggingService();
    let services = { loggingService: loggingService } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({ services: services });
    if (parameters.globalOptions)
        domServices.options.submitButton = parameters.globalOptions;
    let currentStateRequests: Array<{ group?: string }> = [];
    let valueHostsManager = {
        services: { domServices: domServices },
        currentValidationState: (options: { group?: string }) => {
            currentStateRequests.push(options);
            return parameters.currentState ?? createState(false);
        }
    } as unknown as IValueHostsManager;
    let presentation = new SubmitButtonPresentation(element, parameters.options ?? {});
    presentation.init(valueHostsManager);
    return {
        domServices: domServices,
        element: element,
        loggingService: loggingService,
        presentation: presentation,
        valueHostsManager: valueHostsManager,
        currentStateRequests: currentStateRequests
    };
}

function createInput(type: string): HTMLInputElement
{
    let input = document.createElement('input');
    input.type = type;
    return input;
}

// The presentation supports the three button flavors. Each is disabled and styled the same way,
// so the scenarios are run against every supported element.
describe('SubmitButtonPresentation.init', () => {
    test('Adds the persistent class to each supported button type and leaves it enabled', () => {
        let elements = [document.createElement('button'), createInput('submit'), createInput('button')];

        for (let element of elements)
        {
            let testData = setup({ element: element });

            expect(element.classList.contains('jivs-submitbutton')).toBe(true);
            expect((element as HTMLButtonElement | HTMLInputElement).disabled).toBe(false);
            expect(testData.loggingService!.calls).toHaveLength(0);
        }
    });

    test('Adds variation classes after the persistent class', () => {
        let testData = setup({ options: { variationClasses: 'primary large' } });

        expect(testData.element.className).toBe('jivs-submitbutton primary large');
    });

    test('Exposes the do-not-save class name', () => {
        let testData = setup();

        expect(testData.presentation.doNotSaveClass).toEqual(['jivs-do-not-save']);
    });
});

// An unsupported element is reported once at init so the developer can correct the markup.
describe('SubmitButtonPresentation with an unsupported element', () => {
    test('Logs a warning identifying the element and the presentation', () => {
        let element = document.createElement('div');
        element.setAttribute('id', 'notAButton');

        let testData = setup({ element: element });

        expect(testData.loggingService!.calls).toHaveLength(1);
        let call = testData.loggingService!.calls[0];
        expect(call.level).toBe(LoggingLevel.Warn);
        expect(call.details!.message).toBe(
            'SubmitButtonPresentation only supports input type="submit", button type="submit", and input type="button"');
        expect(call.details!.feature).toBe('Dom');
        expect(call.details!.type).toBe(testData.presentation);
        expect((call.details!.data as Record<string, unknown>)['idAttribute']).toBe('notAButton');
    });

    test('Logs for an input whose type is not submit or button', () => {
        let testData = setup({ element: createInput('text') });

        expect(testData.loggingService!.calls).toHaveLength(1);
        expect(testData.loggingService!.calls[0].level).toBe(LoggingLevel.Warn);
    });

    test('Does not throw when there is no logging service', () => {
        expect(() => setup({ element: document.createElement('div'), loggingEnabled: false })).not.toThrow();
    });

    test('Ignores validation state, leaving the element unchanged', () => {
        let element = document.createElement('div');
        let testData = setup({ element: element });

        testData.presentation.apply(testData.valueHostsManager, createState(true));

        expect(element.classList.contains('jivs-do-not-save')).toBe(false);
        expect(element.hasAttribute('disabled')).toBe(false);
    });
});

// The core behavior: doNotSave disables the button and adds a class; clearing it restores both.
describe('SubmitButtonPresentation.apply', () => {
    test('Disables each supported button type and adds the do-not-save class when doNotSave is true', () => {
        let elements = [document.createElement('button'), createInput('submit'), createInput('button')];

        for (let element of elements)
        {
            let testData = setup({ element: element });

            testData.presentation.apply(testData.valueHostsManager, createState(true));

            expect((element as HTMLButtonElement | HTMLInputElement).disabled).toBe(true);
            expect(element.classList.contains('jivs-do-not-save')).toBe(true);
            expect(element.classList.contains('jivs-submitbutton')).toBe(true);
        }
    });

    test('Enables the button and removes the class when doNotSave returns to false', () => {
        let testData = setup();
        testData.presentation.apply(testData.valueHostsManager, createState(true));

        testData.presentation.apply(testData.valueHostsManager, createState(false));

        expect((testData.element as HTMLButtonElement).disabled).toBe(false);
        expect(testData.element.classList.contains('jivs-do-not-save')).toBe(false);
    });

    test('Repeating the same state is stable', () => {
        let testData = setup();

        testData.presentation.apply(testData.valueHostsManager, createState(true));
        testData.presentation.apply(testData.valueHostsManager, createState(true));
        expect((testData.element as HTMLButtonElement).disabled).toBe(true);
        expect(testData.element.classList.contains('jivs-do-not-save')).toBe(true);

        testData.presentation.apply(testData.valueHostsManager, createState(false));
        testData.presentation.apply(testData.valueHostsManager, createState(false));
        expect((testData.element as HTMLButtonElement).disabled).toBe(false);
        expect(testData.element.classList.contains('jivs-do-not-save')).toBe(false);
    });

    test('Does not log during a normal apply', () => {
        let testData = setup();

        testData.presentation.apply(testData.valueHostsManager, createState(true));

        expect(testData.loggingService!.calls).toHaveLength(0);
    });
});

// allowDisable = false lets the page manage the disabled state; only the class is maintained.
describe('SubmitButtonPresentation allowDisable option', () => {
    test('Instance option false adds the class but never changes disabled', () => {
        let testData = setup({ options: { allowDisable: false } });
        let button = testData.element as HTMLButtonElement;

        testData.presentation.apply(testData.valueHostsManager, createState(true));
        expect(button.disabled).toBe(false);
        expect(button.classList.contains('jivs-do-not-save')).toBe(true);

        button.disabled = true; // the page's own state
        testData.presentation.apply(testData.valueHostsManager, createState(false));
        expect(button.disabled).toBe(true);
        expect(button.classList.contains('jivs-do-not-save')).toBe(false);
    });

    test('Global option false applies when the instance does not specify it', () => {
        let testData = setup({ globalOptions: { allowDisable: false } });

        testData.presentation.apply(testData.valueHostsManager, createState(true));

        expect((testData.element as HTMLButtonElement).disabled).toBe(false);
        expect(testData.element.classList.contains('jivs-do-not-save')).toBe(true);
    });

    test('Instance option true overrides a global option of false', () => {
        let testData = setup({ options: { allowDisable: true }, globalOptions: { allowDisable: false } });

        testData.presentation.apply(testData.valueHostsManager, createState(true));

        expect((testData.element as HTMLButtonElement).disabled).toBe(true);
    });
});

// FormPresentationBase routes by validation group; these confirm the submit button honors that routing.
describe('SubmitButtonPresentation group routing', () => {
    test('Responds to a state with the same group, ignoring case', () => {
        let testData = setup({ presentationGroup: 'Billing' });

        testData.presentation.apply(testData.valueHostsManager, createState(true, 'billing'));

        expect((testData.element as HTMLButtonElement).disabled).toBe(true);
    });

    test('Ignores a state for a different group', () => {
        let testData = setup({ presentationGroup: 'Billing' });

        testData.presentation.apply(testData.valueHostsManager, createState(true, 'Shipping'));

        expect((testData.element as HTMLButtonElement).disabled).toBe(false);
    });

    test('A wildcard presentation ignores a state for a specific group', () => {
        let testData = setup();

        testData.presentation.apply(testData.valueHostsManager, createState(true, 'Shipping'));

        expect((testData.element as HTMLButtonElement).disabled).toBe(false);
    });

    test('A group presentation ignores a wildcard state by default', () => {
        let testData = setup({ presentationGroup: 'Billing' });

        testData.presentation.apply(testData.valueHostsManager, createState(true));

        expect((testData.element as HTMLButtonElement).disabled).toBe(false);
        expect(testData.currentStateRequests).toHaveLength(0);
    });

    test('With respondToWildcardGroup, a group presentation uses the current state of its own group', () => {
        let testData = setup({
            presentationGroup: 'Billing',
            options: { respondToWildcardGroup: true },
            currentState: createState(true, 'Billing')
        });

        // The wildcard state says it is fine to save, but the group's own state says do not save.
        testData.presentation.apply(testData.valueHostsManager, createState(false));

        expect(testData.currentStateRequests).toEqual([{ group: 'Billing' }]);
        expect((testData.element as HTMLButtonElement).disabled).toBe(true);
    });
});

// Disposal releases the services and options; a disposed presentation must not be reused.
describe('SubmitButtonPresentation.dispose', () => {
    test('Does not throw and leaves the element as it was', () => {
        let testData = setup();
        testData.presentation.apply(testData.valueHostsManager, createState(true));

        expect(() => testData.presentation.dispose()).not.toThrow();

        expect((testData.element as HTMLButtonElement).disabled).toBe(true);
    });
});
