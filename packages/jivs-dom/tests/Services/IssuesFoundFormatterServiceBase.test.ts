import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidationSeverity, type IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { IssuesFoundFormatterServiceBase } from '../../src/Services/IssuesFoundFormatterServiceBase';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Implements the abstract formatting operations and exposes base utilities for focused tests.
 */
class TestIssuesFoundFormatterService extends IssuesFoundFormatterServiceBase
{
    public buildAsHtml(): string
    {
        return '';
    }

    public buildAsText(): string
    {
        return '';
    }

    public publicify_domService(): IJivsDomServices
    {
        return this.domServices;
    }

    public publicify_orderIssuesFound(issues: IssueFound[]): IssueFound[]
    {
        return this.orderIssuesFound(issues);
    }

    public publicify_buildIssueAsHtml(
        valueHostsManager: IValueHostsManager,
        tagName: keyof HTMLElementTagNameMap,
        issue: IssueFound,
        useSummaryMessage: boolean
    ): string
    {
        return this.buildIssueAsHtml(valueHostsManager, tagName, issue, useSummaryMessage);
    }

    public publicify_buildErrorCodeAttribute(
        issue: IssueFound,
        attributeName?: string
    ): string
    {
        return this.buildErrorCodeAttribute(
            {} as IValueHostsManager,
            issue,
            attributeName
        );
    }

    public publicify_buildSeverityAttribute(
        issue: IssueFound,
        attributeName?: string
    ): string
    {
        return this.buildSeverityAttribute(
            {} as IValueHostsManager,
            issue,
            attributeName
        );
    }

    public publicify_buildValueHostAttribute(
        valueHostsManager: IValueHostsManager,
        issue: IssueFound,
        attributeName?: string
    ): string
    {
        return this.buildValueHostAttribute(valueHostsManager, issue, attributeName);
    }

    public publicify_retrieveMessage(issue: IssueFound, useSummaryMessage: boolean): string
    {
        return this.retrieveMessage(issue, useSummaryMessage);
    }

    public publicify_retrieveSeverityName(severity: ValidationSeverity | undefined): string
    {
        return this.retrieveSeverityName(severity);
    }
}

/**
 * Creates an IssueFound with an individual message and any supplied overrides.
 */
function createIssue(overrides: Partial<IssueFound> = {}): IssueFound
{
    return {
        errorMessage: 'The field is invalid.',
        ...overrides
    };
}

/**
 * Creates a focused manager fake for resolving a field value host.
 */
function createValueHostsManager(
    resolveFieldValueHost: (name: Parameters<IValueHostsManager['getFieldValueHost']>[0]) =>
        IFieldValueHost | null
): IValueHostsManager
{
    return {
        getFieldValueHost: resolveFieldValueHost
    } as unknown as IValueHostsManager;
}

/**
 * Creates the abstract service test subject with its required DOM-services dependency.
 */
function setup(): {
    domServices: IJivsDomServices,
    testItem: TestIssuesFoundFormatterService
}
{
    let domServices = createMockJivsDomServices();
    return {
        domServices: domServices,
        testItem: new TestIssuesFoundFormatterService(domServices)
    };
}

// The formatter base rejects a missing service container and subclasses can construct it with a valid one.
describe('IssuesFoundFormatterServiceBase constructor', () => {
    test('Constructs a concrete test subclass when valid DOM services are provided', () => {
        let { domServices, testItem } = setup();

        expect(testItem).toBeInstanceOf(IssuesFoundFormatterServiceBase);
        expect(testItem.publicify_domService()).toBe(domServices);
    });

    test('Rejects null or undefined DOM services', () => {
        expect(() => new TestIssuesFoundFormatterService(null as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
        expect(() => new TestIssuesFoundFormatterService(undefined as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
    });
});

// HTML-to-text conversion removes markup while retaining its text and safely handles empty input.
describe('IssuesFoundFormatterServiceBase.htmlToText', () => {
    test('Returns text content from nested HTML markup', () => {
        expect(IssuesFoundFormatterServiceBase.htmlToText(
            'Please check <span class="token label">First name</span>.'
        )).toBe('Please check First name.');
    });

    test('Returns an empty string for empty HTML', () => {
        expect(IssuesFoundFormatterServiceBase.htmlToText('')).toBe('');
    });
});

// The default ordering hook returns a separate array without changing the supplied issue order.
describe('IssuesFoundFormatterServiceBase.orderIssuesFound', () => {
    test('Copies issue order without modifying the original array', () => {
        let { testItem } = setup();
        let firstIssue = createIssue({ errorCode: 'First' });
        let secondIssue = createIssue({ errorCode: 'Second' });
        let issues = [firstIssue, secondIssue];

        let orderedIssues = testItem.publicify_orderIssuesFound(issues);

        expect(orderedIssues).not.toBe(issues);
        expect(orderedIssues).toEqual([firstIssue, secondIssue]);
        expect(orderedIssues[0]).toBe(firstIssue);
        expect(issues).toEqual([firstIssue, secondIssue]);
    });

    test('Returns a distinct empty array when there are no issues', () => {
        let { testItem } = setup();
        let issues: IssueFound[] = [];

        let orderedIssues = testItem.publicify_orderIssuesFound(issues);

        expect(orderedIssues).not.toBe(issues);
        expect(orderedIssues).toEqual([]);
    });
});

// A single HTML issue combines metadata attributes and preserves prepared message markup.
describe('IssuesFoundFormatterServiceBase.buildIssueAsHtml', () => {
    test('Wraps the selected message in the requested tag with encoded metadata attributes', () => {
        let { testItem } = setup();
        let manager = createValueHostsManager(() => ({
            getElementIdentifier: () => 'first&name'
        } as unknown as IFieldValueHost));
        let issue = createIssue({
            errorCode: 'Bad<&',
            severity: ValidationSeverity.Error,
            valueHostName: 'FirstName',
            summaryMessage: '<strong>Summary</strong>'
        });

        let result = testItem.publicify_buildIssueAsHtml(manager, 'li', issue, true);

        expect(result).toBe(
            '<li data-errorcode="Bad&lt;&amp;" data-severity="error" ' +
            'data-identifier="first&amp;name"><strong>Summary</strong></li>'
        );
    });

    test('Uses the individual message when summary messages are not requested', () => {
        let { testItem } = setup();
        let manager = createValueHostsManager(() => ({
            getElementIdentifier: () => 'first-name'
        } as unknown as IFieldValueHost));
        let issue = createIssue({
            errorCode: 'Required',
            severity: ValidationSeverity.Error,
            valueHostName: 'FirstName',
            errorMessage: '<em>Nearby</em>',
            summaryMessage: 'Summary'
        });

        let result = testItem.publicify_buildIssueAsHtml(
            manager,
            'div',
            issue,
            false
        );

        expect(result).toBe(
            '<div data-errorcode="Required" data-severity="error" ' +
            'data-identifier="first-name"><em>Nearby</em></div>'
        );
    });
});

// Error-code attributes use the default or caller-specified name and HTML-encode their value.
describe('IssuesFoundFormatterServiceBase.buildErrorCodeAttribute', () => {
    test('Encodes an error code and uses the default attribute name', () => {
        let { testItem } = setup();

        expect(testItem.publicify_buildErrorCodeAttribute(createIssue({ errorCode: 'A<&"' })))
            .toBe('data-errorcode="A&lt;&amp;&quot;"');
    });

    test('Uses a custom attribute name', () => {
        let { testItem } = setup();

        expect(testItem.publicify_buildErrorCodeAttribute(
            createIssue({ errorCode: 'Required' }),
            'data-code'
        )).toBe('data-code="Required"');
    });

    test('Emits an empty value for a missing or empty error code', () => {
        let { testItem } = setup();

        expect(testItem.publicify_buildErrorCodeAttribute(createIssue()))
            .toBe('data-errorcode=""');
        expect(testItem.publicify_buildErrorCodeAttribute(createIssue({ errorCode: '' })))
            .toBe('data-errorcode=""');
    });
});

// Severity names are stable, while metadata attributes use the documented default or custom name.
describe('IssuesFoundFormatterServiceBase.buildSeverityAttribute', () => {
    test('Builds the warning, error, and severe severity attributes', () => {
        let { testItem } = setup();

        expect(testItem.publicify_buildSeverityAttribute(createIssue({ severity: ValidationSeverity.Warning })))
            .toBe('data-severity="warning"');
        expect(testItem.publicify_buildSeverityAttribute(createIssue({ severity: ValidationSeverity.Error })))
            .toBe('data-severity="error"');
        expect(testItem.publicify_buildSeverityAttribute(createIssue({ severity: ValidationSeverity.Severe })))
            .toBe('data-severity="severe"');
        expect(testItem.publicify_buildSeverityAttribute(
            createIssue({ severity: ValidationSeverity.Severe }),
            'data-level'
        )).toBe('data-level="severe"');
    });

    test('Uses error severity when the issue severity is missing', () => {
        let { testItem } = setup();

        expect(testItem.publicify_buildSeverityAttribute(createIssue()))
            .toBe('data-severity="error"');
    });
});

// Value-host metadata is omitted without a resolvable host and otherwise references its encoded element identifier.
describe('IssuesFoundFormatterServiceBase.buildValueHostAttribute', () => {
    test('Does not resolve a value host when the issue has no value-host name', () => {
        let { testItem } = setup();
        let lookupCount = 0;
        let manager = createValueHostsManager(() => {
            lookupCount++;
            return null;
        });

        expect(testItem.publicify_buildValueHostAttribute(manager, createIssue())).toBe('');
        expect(lookupCount).toBe(0);
    });

    test('Omits the attribute when the named value host cannot be resolved', () => {
        let { testItem } = setup();
        let requestedName: string | undefined;
        let manager = createValueHostsManager(name => {
            requestedName = name;
            return null;
        });

        expect(testItem.publicify_buildValueHostAttribute(
            manager,
            createIssue({ valueHostName: 'FirstName' })
        )).toBe('');
        expect(requestedName).toBe('FirstName');
    });

    test('Uses an encoded element identifier and a custom attribute name', () => {
        let { testItem } = setup();
        let manager = createValueHostsManager(() => ({
            getElementIdentifier: () => 'first" name'
        } as unknown as IFieldValueHost));

        expect(testItem.publicify_buildValueHostAttribute(
            manager,
            createIssue({ valueHostName: 'FirstName' }),
            'data-field'
        )).toBe('data-field="first&quot; name"');
    });
});

// Message retrieval selects the requested message and falls back to the individual message for missing summaries.
describe('IssuesFoundFormatterServiceBase.retrieveMessage', () => {
    test('Returns the individual message when the summary is not requested', () => {
        let { testItem } = setup();

        expect(testItem.publicify_retrieveMessage(
            createIssue({ errorMessage: 'Nearby', summaryMessage: 'Summary' }),
            false
        )).toBe('Nearby');
    });

    test('Returns the summary message when requested and available', () => {
        let { testItem } = setup();

        expect(testItem.publicify_retrieveMessage(
            createIssue({ errorMessage: 'Nearby', summaryMessage: 'Summary' }),
            true
        )).toBe('Summary');
    });

    test('Falls back to the individual message when the requested summary is unavailable', () => {
        let { testItem } = setup();

        expect(testItem.publicify_retrieveMessage(createIssue(), true))
            .toBe('The field is invalid.');
    });

    test('Returns empty content when both messages are empty', () => {
        let { testItem } = setup();

        expect(testItem.publicify_retrieveMessage(
            createIssue({ errorMessage: '', summaryMessage: '' }),
            true
        )).toBe('');
    });
});

// Severity values map to the names used by generated metadata, including the absent-severity default.
describe('IssuesFoundFormatterServiceBase.retrieveSeverityName', () => {
    test('Maps warning, error, severe, and undefined severities', () => {
        let { testItem } = setup();

        expect(testItem.publicify_retrieveSeverityName(ValidationSeverity.Warning)).toBe('warning');
        expect(testItem.publicify_retrieveSeverityName(ValidationSeverity.Error)).toBe('error');
        expect(testItem.publicify_retrieveSeverityName(ValidationSeverity.Severe)).toBe('severe');
        expect(testItem.publicify_retrieveSeverityName(undefined)).toBe('error');
    });
});
