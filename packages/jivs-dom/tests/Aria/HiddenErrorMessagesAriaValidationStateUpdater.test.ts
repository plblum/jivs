import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IIssuesFoundFormatterService } from '../../src/Interfaces/IssuesFoundFormatterService';
import { HiddenErrorMessagesAriaValidationStateUpdater } from '../../src/Aria/HiddenErrorMessagesAriaValidationStateUpdater';
import { ElementRole } from '../../src/Interfaces/Types';
import { FieldValueHost } from '@plblum/jivs-engine/build/ValueHosts/FieldValueHost';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';

/**
 * Creates a complete validation-state fixture containing the supplied issues.
 * @param issuesFound - Issues to pass to the updater; defaults to no issues.
 */
function createValidationState(issuesFound: IssueFound[] | null = null): ValueHostValidationState
{
    let isValid = issuesFound === null || issuesFound.length === 0;
    return {
        isValid: isValid,
        doNotSave: !isValid,
        issuesFound: issuesFound,
        asyncProcessing: false,
        status: isValid ? ValidationStatus.Valid : ValidationStatus.Invalid,
        corrected: false
    };
}

/**
 * Creates a host fake that records formatter arguments and returns configured plain text.
 * @param formattedText - Text returned by the fake formatter.
 */
function createValueHost(formattedText: string = 'Formatted issues'): {
    valueHost: IFieldValueHost,
    formatCalls: Array<{
        valueHostsManager: IValueHostsManager,
        issues: IssueFound[],
        useSummaryMessage: boolean | undefined,
        separator: string | undefined,
        limit: number | undefined
    }>
}
{
    let formatCalls: Array<{
        valueHostsManager: IValueHostsManager,
        issues: IssueFound[],
        useSummaryMessage: boolean | undefined,
        separator: string | undefined,
        limit: number | undefined
    }> = [];
    let formatter: IIssuesFoundFormatterService = {
        buildAsHtml: () => '',
        buildAsText: (manager, issues, useSummaryMessage, separator, limit) => {
            formatCalls.push({
                valueHostsManager: manager,
                issues: issues,
                useSummaryMessage: useSummaryMessage,
                separator: separator,
                limit: limit
            });
            return formattedText;
        }
    };
    let domServices = {
        issuesFoundFormatterService: formatter
    } as unknown as IJivsDomServices;
    let valueHostsManager = {
        services: {
            domServices: domServices
        }
    } as unknown as IValueHostsManager;
    let valueHost = {
        valueHostsManager: valueHostsManager
    } as unknown as IFieldValueHost;
    return { valueHost: valueHost, formatCalls: formatCalls };
}

/**
 * Creates an aria-error element and its updater.
 * @param separator - Custom issue separator; omitted to use the default.
 * @param limit - Maximum number of issues; omitted to use the default.
 * @param role - Role stored on the element; defaults to ElementRole.ariaError.
 */
function setup(separator?: string, limit?: number | null, role: ElementRole | string = ElementRole.ariaError): {
    element: IJivsElement,
    testItem: HiddenErrorMessagesAriaValidationStateUpdater
}
{
    let element = document.createElement('div') as IJivsElement;
    element.jivsElementRole = role;
    return {
        element: element,
        testItem: new HiddenErrorMessagesAriaValidationStateUpdater(separator, limit)
    };
}

// The updater formats every current issue as field-level plain text using the default constructor options.
describe('HiddenErrorMessagesAriaValidationStateUpdater default formatting', () => {
    test('Writes formatter output and requests individual messages with the default separator and no limit', () => {
        let { element, testItem } = setup();
        let { valueHost, formatCalls } = createValueHost('First issue; second issue');
        let issuesFound: IssueFound[] = [
            { errorMessage: 'First issue' },
            { errorMessage: 'Second issue' }
        ];
        let state = createValidationState(issuesFound);

        testItem.applyValidationState(element, valueHost, state);

        expect(element.textContent).toBe('First issue; second issue');
        expect(formatCalls).toHaveLength(1);
        expect(formatCalls[0].valueHostsManager).toBe(valueHost.valueHostsManager);
        expect(formatCalls[0].issues).toBe(issuesFound);
        expect(formatCalls[0].useSummaryMessage).toBe(false);
        expect(formatCalls[0].separator).toBe('; ');
        expect(formatCalls[0].limit).toBeUndefined();
    });
    test('Uses custom separator and issue limit when configured', () => {
        let { element, testItem } = setup(' | ', 2);
        let { valueHost, formatCalls } = createValueHost('First | second');
        let issuesFound: IssueFound[] = [
            { errorMessage: 'First' },
            { errorMessage: 'Second' },
            { errorMessage: 'Third' }
        ];

        testItem.applyValidationState(element, valueHost, createValidationState(issuesFound));

        expect(element.textContent).toBe('First | second');
        expect(formatCalls[0]).toEqual({
            valueHostsManager: valueHost.valueHostsManager,
            issues: issuesFound,
            useSummaryMessage: false,
            separator: ' | ',
            limit: 2
        });
    });
    test('Passes a zero limit to the formatter as configured', () => {
        let { element, testItem } = setup('; ', 0);
        let { valueHost, formatCalls } = createValueHost('');
        let issuesFound: IssueFound[] = [{ errorMessage: 'First' }];

        testItem.applyValidationState(element, valueHost, createValidationState(issuesFound));

        expect(element.textContent).toBe('');
        expect(formatCalls[0].limit).toBe(0);
    });
});

// Empty or absent issues clear prior content without invoking the formatter.
describe('HiddenErrorMessagesAriaValidationStateUpdater clearing content', () => {
    test('Clears prior content when issuesFound is null', () => {
        let { element, testItem } = setup();
        element.textContent = 'Old message';
        let { valueHost, formatCalls } = createValueHost();

        testItem.applyValidationState(element, valueHost, createValidationState(null));

        expect(element.textContent).toBe('');
        expect(formatCalls).toHaveLength(0);
    });
    test('Clears prior content when issuesFound is an empty array', () => {
        let { element, testItem } = setup();
        element.textContent = 'Old message';
        let { valueHost, formatCalls } = createValueHost();

        testItem.applyValidationState(element, valueHost, createValidationState([]));

        expect(element.textContent).toBe('');
        expect(formatCalls).toHaveLength(0);
    });
});

// The updater only writes to elements explicitly assigned the dedicated aria-error role.
describe('HiddenErrorMessagesAriaValidationStateUpdater role gating', () => {
    test('Leaves content unchanged for an element with another Jivs role', () => {
        let { element, testItem } = setup(undefined, undefined, ElementRole.error);
        element.textContent = 'Authored content';
        let { valueHost, formatCalls } = createValueHost();

        testItem.applyValidationState(element, valueHost, createValidationState([
            { errorMessage: 'New issue' }
        ]));

        expect(element.textContent).toBe('Authored content');
        expect(formatCalls).toHaveLength(0);
    });
    test('Leaves content unchanged when the element has no Jivs role', () => {
        let { element, testItem } = setup();
        element.jivsElementRole = undefined;
        element.textContent = 'Authored content';
        let { valueHost, formatCalls } = createValueHost();

        testItem.applyValidationState(element, valueHost, createValidationState([
            { errorMessage: 'New issue' }
        ]));

        expect(element.textContent).toBe('Authored content');
        expect(formatCalls).toHaveLength(0);
    });
});

// Real engine and DOM services verify that actual FieldValueHost issues become accessible plain-text content.
describe('HiddenErrorMessagesAriaValidationStateUpdater with real services', () => {
    test('Formats real external issues as plain text and clears the content when they are removed', () => {
        let { valueHost } = setupFieldValueHostForTesting();
        valueHost.addExternalIssueFound({ errorMessage: 'Name is required' }, true);
        valueHost.addExternalIssueFound({ errorMessage: 'Name is too short' }, true);
        valueHost.validate();
        let element = document.createElement('div') as IJivsElement;
        element.jivsElementRole = ElementRole.ariaError;
        let testItem = new HiddenErrorMessagesAriaValidationStateUpdater();

        expect(valueHost).toBeInstanceOf(FieldValueHost);
        expect(valueHost.currentValidationState.issuesFound).toHaveLength(2);
        testItem.applyValidationState(element, valueHost, valueHost.currentValidationState);

        expect(element.textContent).toBe('Name is required; Name is too short');

        valueHost.clearExternalIssuesFound();
        valueHost.validate();
        testItem.applyValidationState(element, valueHost, valueHost.currentValidationState);

        expect(valueHost.currentValidationState.issuesFound).toBeNull();
        expect(element.textContent).toBe('');
    });
    test('Applies a custom separator and limit through the real formatter', () => {
        let { valueHost } = setupFieldValueHostForTesting();
        valueHost.addExternalIssueFound({ errorMessage: 'First issue' }, true);
        valueHost.addExternalIssueFound({ errorMessage: 'Second issue' }, true);
        valueHost.addExternalIssueFound({ errorMessage: 'Third issue' }, true);
        valueHost.validate();
        let element = document.createElement('div') as IJivsElement;
        element.jivsElementRole = ElementRole.ariaError;
        let testItem = new HiddenErrorMessagesAriaValidationStateUpdater(' / ', 2);

        testItem.applyValidationState(element, valueHost, valueHost.currentValidationState);

        expect(element.textContent).toBe('First issue / Second issue');
    });
});
