/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    ErrorMessageDisplayPresentationBase,
    ErrorMessageDisplayPresentationBaseOptions
} from '../../src/FieldPresentations/ErrorMessageDisplayPresentationBase';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

class TestErrorMessageDisplayPresentation extends
    ErrorMessageDisplayPresentationBase<ErrorMessageDisplayPresentationBaseOptions>
{
    public eventCalls: Array<
        { name: 'remove' } |
        { name: 'apply', valueHost: IFieldValueHost, issuesFound: IssueFound[] }
    > = [];
    public initializedValueHosts: IFieldValueHost[] = [];
    public failNextInitialization: boolean = false;

    public constructor(element: HTMLElement)
    {
        super(element);
    }

    protected override getGlobalOptions(): object | undefined
    {
        return undefined;
    }

    protected override applyIssuesFound(valueHost: IFieldValueHost, issuesFound: IssueFound[]): void
    {
        this.eventCalls.push({
            name: 'apply',
            valueHost: valueHost,
            issuesFound: issuesFound
        });
        super.applyIssuesFound(valueHost, issuesFound);
    }

    protected override removeIssuesFound(): void
    {
        this.eventCalls.push({ name: 'remove' });
        super.removeIssuesFound();
    }

    protected override ensureValueHostInitializedWorker(valueHost: IFieldValueHost): void
    {
        this.initializedValueHosts.push(valueHost);
        if (this.failNextInitialization)
        {
            this.failNextInitialization = false;
            throw new Error('Initialization failed.');
        }
        super.ensureValueHostInitializedWorker(valueHost);
    }
}

function createPresentation(): {
    presentation: TestErrorMessageDisplayPresentation;
    element: HTMLElement;
}
{
    let element = document.createElement('div');
    let presentation = new TestErrorMessageDisplayPresentation(element);
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
    return { presentation: presentation, element: element };
}

function createValueHost(): IFieldValueHost
{
    return {} as IFieldValueHost;
}

function createState(issuesFound?: IssueFound[] | null): ValueHostValidationState
{
    return {
        isValid: !issuesFound || issuesFound.length === 0,
        issuesFound: issuesFound
    } as ValueHostValidationState;
}

// Error-message displays provide a stable class contract and style the presentation element itself.
describe('ErrorMessageDisplayPresentationBase identity', () => {
    test('Adds the persistent display class and exposes the default issue-state class', () => {
        let { presentation, element } = createPresentation();

        expect(element.classList.contains('jivs-errormessagedisplay')).toBe(true);
        expect(presentation.hasIssuesClass).toEqual(['jivs-has-issues']);
    });
});

// apply() clears stale issue styling before adding it only when the current state has issues.
describe('ErrorMessageDisplayPresentationBase.apply', () => {
    test('Adds issue styling when issues are present and removes it on an empty state', () => {
        let { presentation, element } = createPresentation();
        let valueHost = createValueHost();
        let issuesFound = [{ errorMessage: 'Invalid value' }] as IssueFound[];

        presentation.apply(valueHost, createState(issuesFound));
        expect(element.classList.contains('jivs-has-issues')).toBe(true);
        expect(presentation.eventCalls).toEqual([
            { name: 'remove' },
            { name: 'apply', valueHost: valueHost, issuesFound: issuesFound }
        ]);

        presentation.apply(valueHost, createState([]));
        expect(element.classList.contains('jivs-has-issues')).toBe(false);
        expect(presentation.eventCalls.slice(2)).toEqual([{ name: 'remove' }]);
    });

    test('Removes issue styling when issuesFound is null or undefined', () => {
        let { presentation, element } = createPresentation();
        let valueHost = createValueHost();
        presentation.apply(valueHost, createState([{ errorMessage: 'Issue' }] as IssueFound[]));

        presentation.apply(valueHost, createState(null));
        expect(element.classList.contains('jivs-has-issues')).toBe(false);

        presentation.apply(valueHost, createState(undefined));
        expect(element.classList.contains('jivs-has-issues')).toBe(false);
        expect(presentation.eventCalls.map(call => call.name)).toEqual([
            'remove', 'apply', 'remove', 'remove'
        ]);
    });

    test('Removes previously added issue styling before applying the next non-empty issue set', () => {
        let { presentation, element } = createPresentation();
        let valueHost = createValueHost();

        presentation.apply(valueHost, createState([{ errorMessage: 'First' }] as IssueFound[]));
        presentation.apply(valueHost, createState([{ errorMessage: 'Second' }] as IssueFound[]));

        expect(element.classList.contains('jivs-has-issues')).toBe(true);
        expect(presentation.eventCalls.map(call => call.name)).toEqual([
            'remove', 'apply', 'remove', 'apply'
        ]);
    });
});

// Value-host setup is lazy and occurs once, while a failed setup remains eligible for retry.
describe('ErrorMessageDisplayPresentationBase value-host initialization', () => {
    test('Initializes from the first apply call and does not repeat initialization', () => {
        let { presentation } = createPresentation();
        let firstValueHost = createValueHost();
        let laterValueHost = createValueHost();

        presentation.apply(firstValueHost, createState([]));
        presentation.apply(laterValueHost, createState([]));

        expect(presentation.initializedValueHosts).toEqual([firstValueHost]);
    });

    test('Retries initialization if the first initialization attempt throws', () => {
        let { presentation } = createPresentation();
        let valueHost = createValueHost();
        presentation.failNextInitialization = true;

        expect(() => presentation.apply(valueHost, createState([]))).toThrow('Initialization failed.');

        presentation.apply(valueHost, createState([]));

        expect(presentation.initializedValueHosts).toEqual([valueHost, valueHost]);
    });
});
