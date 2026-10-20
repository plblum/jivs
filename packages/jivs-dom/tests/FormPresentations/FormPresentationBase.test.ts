/** @jest-environment jsdom */
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type {
    FormPresentationBaseGlobalOptions,
    FormPresentationBaseOptions
} from '../../src/FormPresentations/FormPresentationBase';
import { FormPresentationBase } from '../../src/FormPresentations/FormPresentationBase';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IRecordedApply
{
    valueHostsManager: IValueHostsManager;
    state: ValidationState;
}

class TestFormPresentation extends FormPresentationBase<FormPresentationBaseOptions>
{
    public applyCalls: IRecordedApply[] = [];

    constructor(element: IJivsElement, options?: FormPresentationBaseOptions)
    {
        super(element, options);
    }

    public get publicify_options(): FormPresentationBaseOptions
    {
        return this.options;
    }

    protected override getGlobalOptions(): FormPresentationBaseGlobalOptions | undefined
    {
        return this.domServices.options.validationSummary;
    }

    protected override applyCore(valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        this.applyCalls.push({
            valueHostsManager: valueHostsManager,
            state: state
        });
    }
}

interface ISetup
{
    domServices: IJivsDomServices;
    element: IJivsElement;
    presentation: TestFormPresentation;
    valueHostsManager: IValueHostsManager;
    state: ValidationState;
    filteredState: ValidationState;
    currentStateOptions: Array<object | null | undefined>;
}

function createValidationState(group?: string): ValidationState
{
    return {
        isValid: true,
        doNotSave: false,
        issuesFound: null,
        asyncProcessing: false,
        group: group
    };
}

function setup(
    presentationGroup?: string,
    options?: FormPresentationBaseOptions,
    globalOptions?: FormPresentationBaseGlobalOptions
): ISetup
{
    let domServices = createMockJivsDomServices();
    domServices.options.validationSummary = globalOptions ?? {};
    let element = document.createElement('div') as IJivsElement;
    element.jivsFormPresentationGroup = presentationGroup;
    let state = createValidationState('Billing');
    let filteredState = createValidationState(presentationGroup);
    let currentStateOptions: Array<object | null | undefined> = [];
    let valueHostsManager = {
        services: { domServices: domServices },
        currentValidationState: (stateOptions?: object | null) => {
            currentStateOptions.push(stateOptions);
            return filteredState;
        }
    } as unknown as IValueHostsManager;
    let presentation = new TestFormPresentation(element, options);
    presentation.init(valueHostsManager);

    return {
        domServices: domServices,
        element: element,
        presentation: presentation,
        valueHostsManager: valueHostsManager,
        state: state,
        filteredState: filteredState,
        currentStateOptions: currentStateOptions
    };
}

// Form presentation options default to ignoring wildcard validation results unless explicitly enabled.
describe('FormPresentationBase options and ARIA updater', () => {
    test('Defaults respondToWildcardGroup to false and has no static ARIA updater', () => {
        let testData = setup();

        expect(testData.presentation.publicify_options.respondToWildcardGroup).toBe(false);
        expect(testData.presentation.getStaticAriaUpdater()).toBeNull();
    });

    test('Uses global wildcard behavior unless overridden by instance options', () => {
        let globalEnabled = setup('Billing', undefined, { respondToWildcardGroup: true });
        let instanceDisabled = setup(
            'Billing',
            { respondToWildcardGroup: false },
            { respondToWildcardGroup: true }
        );
        let instanceEnabled = setup(
            'Billing',
            { respondToWildcardGroup: true },
            { respondToWildcardGroup: false }
        );

        expect(globalEnabled.presentation.publicify_options.respondToWildcardGroup).toBe(true);
        expect(instanceDisabled.presentation.publicify_options.respondToWildcardGroup).toBe(false);
        expect(instanceEnabled.presentation.publicify_options.respondToWildcardGroup).toBe(true);
    });
});

// Applying validation updates only when presentation and state groups match according to the group contract.
describe('FormPresentationBase.apply group matching', () => {
    test('Applies a matching group case-insensitively with the supplied state', () => {
        let testData = setup('billing');
        let state = createValidationState('BILLING');

        testData.presentation.apply(testData.valueHostsManager, state);

        expect(testData.presentation.applyCalls).toEqual([{
            valueHostsManager: testData.valueHostsManager,
            state: state
        }]);
        expect(testData.currentStateOptions).toHaveLength(0);
    });

    test('Ignores a nonmatching specific group', () => {
        let testData = setup('Billing');
        let state = createValidationState('Shipping');

        testData.presentation.apply(testData.valueHostsManager, state);

        expect(testData.presentation.applyCalls).toHaveLength(0);
        expect(testData.currentStateOptions).toHaveLength(0);
    });

    test('Ignores wildcard states for a specific group by default', () => {
        let testData = setup('Billing');

        testData.presentation.apply(testData.valueHostsManager, createValidationState());

        expect(testData.presentation.applyCalls).toHaveLength(0);
        expect(testData.currentStateOptions).toHaveLength(0);
    });

    test('Uses a group-filtered current state when wildcard responses are enabled', () => {
        let testData = setup('Billing', { respondToWildcardGroup: true });
        let wildcardState = createValidationState();

        testData.presentation.apply(testData.valueHostsManager, wildcardState);

        expect(testData.currentStateOptions).toEqual([{ group: 'Billing' }]);
        expect(testData.presentation.applyCalls).toEqual([{
            valueHostsManager: testData.valueHostsManager,
            state: testData.filteredState
        }]);
    });

    test('Does not query a filtered state when instance options disable a globally enabled response', () => {
        let testData = setup(
            'Billing',
            { respondToWildcardGroup: false },
            { respondToWildcardGroup: true }
        );

        testData.presentation.apply(testData.valueHostsManager, createValidationState('*'));

        expect(testData.currentStateOptions).toHaveLength(0);
        expect(testData.presentation.applyCalls).toHaveLength(0);
    });

    test('Ignores specific states for a presentation configured for a wildcard group', () => {
        let testData = setup();

        testData.presentation.apply(testData.valueHostsManager, testData.state);

        expect(testData.presentation.applyCalls).toHaveLength(0);
        expect(testData.currentStateOptions).toHaveLength(0);
    });

    test('Applies wildcard validation states to a presentation configured for a wildcard group', () => {
        let wildcardGroupValues: Array<string | undefined> = [undefined, '', '*'];

        for (let group of wildcardGroupValues)
        {
            let testData = setup(group);
            let state = createValidationState(group);

            testData.presentation.apply(testData.valueHostsManager, state);

            expect(testData.presentation.applyCalls).toEqual([{
                valueHostsManager: testData.valueHostsManager,
                state: state
            }]);
        }
    });
});
