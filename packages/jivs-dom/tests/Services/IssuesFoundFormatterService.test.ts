/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidationSeverity, type IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

class ReverseOrderedIssuesFoundFormatterService extends IssuesFoundFormatterService
{
    protected override orderIssuesFound(issues: IssueFound[]): IssueFound[]
    {
        return issues.slice().reverse();
    }
}

/**
 * Creates a valid issue with optional overrides.
 */
function createIssue(overrides: Partial<IssueFound> = {}): IssueFound
{
    return {
        errorMessage: 'Invalid value.',
        ...overrides
    };
}

/**
 * Creates a value-host manager fake with a stable field-element identifier.
 */
function createValueHostsManager(): IValueHostsManager
{
    return {
        getFieldValueHost: (_name: Parameters<IValueHostsManager['getFieldValueHost']>[0]) => ({
            getElementIdentifier: () => 'first-name'
        } as unknown as IFieldValueHost)
    } as unknown as IValueHostsManager;
}

class Publicify_IssuesFoundFormatterService extends IssuesFoundFormatterService
{
    public get publicify_domServices() {
        return this.domServices;
    }
}
/**
 * Creates the formatter and the lightweight collaborators used by each test.
 */
function setup(): {
    domServices: IJivsDomServices,
    valueHostsManager: IValueHostsManager,
    testItem: Publicify_IssuesFoundFormatterService;
}
{
    let domServices = createMockJivsDomServices();
    return {
        domServices: domServices,
        valueHostsManager: createValueHostsManager(),
        testItem: new Publicify_IssuesFoundFormatterService(domServices)
    };
}

// The concrete formatter requires DOM services and otherwise uses the shared base construction behavior.
describe('IssuesFoundFormatterService constructor', () => {
    test('Constructs with the supplied DOM services', () => {
        let { domServices, testItem } = setup();

        expect(testItem).toBeInstanceOf(IssuesFoundFormatterService);
        expect(testItem.publicify_domServices).toBe(domServices);
    });

    test('Rejects null or undefined DOM services', () => {
        expect(() => new IssuesFoundFormatterService(null as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
        expect(() => new IssuesFoundFormatterService(undefined as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
    });
});

// HTML output is empty for no issues and supports the legacy null input defensively.
describe('IssuesFoundFormatterService.buildAsHtml empty issues', () => {
    test('Returns an empty string for an empty or null issues collection', () => {
        let { testItem, valueHostsManager } = setup();

        expect(testItem.buildAsHtml(valueHostsManager, [])).toBe('');
        expect(testItem.buildAsHtml(valueHostsManager, null as unknown as IssueFound[])).toBe('');
    });
});

// A single issue is rendered as a span with metadata and the selected prepared message.
describe('IssuesFoundFormatterService.buildAsHtml single issue', () => {
    test('Uses a span and the individual message by default', () => {
        let { testItem, valueHostsManager } = setup();
        let issue = createIssue({
            errorCode: 'Required',
            valueHostName: 'FirstName',
            errorMessage: '<strong>Nearby message</strong>'
        });

        expect(testItem.buildAsHtml(valueHostsManager, [issue])).toBe(
            '<span data-errorcode="Required" data-severity="error" ' +
            'data-identifier="first-name"><strong>Nearby message</strong></span>'
        );
    });

    test('Uses the summary message when requested and falls back to the individual message when absent', () => {
        let { testItem, valueHostsManager } = setup();
        let issueWithSummary = createIssue({
            errorCode: 'Required',
            summaryMessage: 'Summary message'
        });
        let issueWithoutSummary = createIssue({ errorCode: 'Invalid' });

        expect(testItem.buildAsHtml(valueHostsManager, [issueWithSummary], true)).toBe(
            '<span data-errorcode="Required" data-severity="error" >Summary message</span>'
        );
        expect(testItem.buildAsHtml(valueHostsManager, [issueWithoutSummary], true)).toBe(
            '<span data-errorcode="Invalid" data-severity="error" >Invalid value.</span>'
        );
    });

    test('Uses a span when a multi-issue collection is limited to one item', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorCode: 'First', errorMessage: 'First issue' }),
            createIssue({ errorCode: 'Second', errorMessage: 'Second issue' })
        ];

        expect(testItem.buildAsHtml(valueHostsManager, issues, false, 1)).toBe(
            '<span data-errorcode="First" data-severity="error" >First issue</span>'
        );
    });

    test('Uses the first issue after subclass ordering when a multi-issue collection is limited to one item', () => {
        let { domServices, valueHostsManager } = setup();
        let testItem = new ReverseOrderedIssuesFoundFormatterService(domServices);
        let firstIssue = createIssue({ errorCode: 'First', errorMessage: 'First issue' });
        let secondIssue = createIssue({ errorCode: 'Second', errorMessage: 'Second issue' });
        let issues = [firstIssue, secondIssue];

        expect(testItem.buildAsHtml(valueHostsManager, issues, false, 1)).toBe(
            '<span data-errorcode="Second" data-severity="error" >Second issue</span>'
        );
        expect(issues).toEqual([firstIssue, secondIssue]);
    });

    test('Uses a span for one issue even when the limit is zero or negative', () => {
        let { testItem, valueHostsManager } = setup();
        let issue = createIssue({ errorCode: 'Only', errorMessage: 'Only issue' });

        expect(testItem.buildAsHtml(valueHostsManager, [issue], false, 0)).toBe(
            '<span data-errorcode="Only" data-severity="error" >Only issue</span>'
        );
        expect(testItem.buildAsHtml(valueHostsManager, [issue], false, -1)).toBe(
            '<span data-errorcode="Only" data-severity="error" >Only issue</span>'
        );
    });
});

// Multiple issues are rendered as list items, with a positive limit restricting the list.
describe('IssuesFoundFormatterService.buildAsHtml multiple issues', () => {
    test('Wraps every issue in a list item and preserves supplied order', () => {
        let { testItem, valueHostsManager } = setup();
        let firstIssue = createIssue({
            errorCode: 'First',
            severity: ValidationSeverity.Warning,
            errorMessage: 'First issue'
        });
        let secondIssue = createIssue({
            errorCode: 'Second',
            severity: ValidationSeverity.Severe,
            errorMessage: 'Second issue'
        });
        let issues = [firstIssue, secondIssue];

        expect(testItem.buildAsHtml(valueHostsManager, issues)).toBe(
            '<ul><li data-errorcode="First" data-severity="warning" >First issue</li>' +
            '<li data-errorcode="Second" data-severity="severe" >Second issue</li></ul>'
        );
        expect(issues).toEqual([firstIssue, secondIssue]);
    });

    test('Limits the generated list to the requested positive count', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorCode: 'First', errorMessage: 'First issue' }),
            createIssue({ errorCode: 'Second', errorMessage: 'Second issue' }),
            createIssue({ errorCode: 'Third', errorMessage: 'Third issue' })
        ];

        expect(testItem.buildAsHtml(valueHostsManager, issues, false, 2)).toBe(
            '<ul><li data-errorcode="First" data-severity="error" >First issue</li>' +
            '<li data-errorcode="Second" data-severity="error" >Second issue</li></ul>'
        );
    });

    test('Includes every issue when the limit is omitted, zero, negative, or larger than the collection', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorCode: 'First', errorMessage: 'First issue' }),
            createIssue({ errorCode: 'Second', errorMessage: 'Second issue' })
        ];
        let expected =
            '<ul><li data-errorcode="First" data-severity="error" >First issue</li>' +
            '<li data-errorcode="Second" data-severity="error" >Second issue</li></ul>';

        expect(testItem.buildAsHtml(valueHostsManager, issues)).toBe(expected);
        expect(testItem.buildAsHtml(valueHostsManager, issues, false, 0)).toBe(expected);
        expect(testItem.buildAsHtml(valueHostsManager, issues, false, -1)).toBe(expected);
        expect(testItem.buildAsHtml(valueHostsManager, issues, false, 5)).toBe(expected);
    });

    test('Uses the subclass ordering hook before applying the limit without changing the input array', () => {
        let { domServices, valueHostsManager } = setup();
        let testItem = new ReverseOrderedIssuesFoundFormatterService(domServices);
        let firstIssue = createIssue({ errorCode: 'First', errorMessage: 'First issue' });
        let secondIssue = createIssue({ errorCode: 'Second', errorMessage: 'Second issue' });
        let thirdIssue = createIssue({ errorCode: 'Third', errorMessage: 'Third issue' });
        let issues = [firstIssue, secondIssue, thirdIssue];

        expect(testItem.buildAsHtml(valueHostsManager, issues, false, 2)).toBe(
            '<ul><li data-errorcode="Third" data-severity="error" >Third issue</li>' +
            '<li data-errorcode="Second" data-severity="error" >Second issue</li></ul>'
        );
        expect(issues).toEqual([firstIssue, secondIssue, thirdIssue]);
    });

    test('Does not modify issue objects while producing HTML', () => {
        let { testItem, valueHostsManager } = setup();
        let firstIssue = createIssue({
            errorCode: 'First',
            severity: ValidationSeverity.Warning,
            valueHostName: 'FirstName',
            errorMessage: '<b>First</b>',
            summaryMessage: '<strong>First summary</strong>'
        });
        let secondIssue = createIssue({
            errorCode: 'Second',
            severity: ValidationSeverity.Severe,
            errorMessage: '<i>Second</i>',
            summaryMessage: 'Second summary'
        });
        let issues = [firstIssue, secondIssue];
        let originalFirstIssue = { ...firstIssue };
        let originalSecondIssue = { ...secondIssue };

        testItem.buildAsHtml(valueHostsManager, issues, true);

        expect(firstIssue).toEqual(originalFirstIssue);
        expect(secondIssue).toEqual(originalSecondIssue);
        expect(issues[0]).toBe(firstIssue);
        expect(issues[1]).toBe(secondIssue);
    });
});

// Plain-text output retrieves the selected message and joins it with the default or supplied separator.
describe('IssuesFoundFormatterService.buildAsText', () => {
    test('Returns an empty string for an empty or null issues collection', () => {
        let { testItem, valueHostsManager } = setup();

        expect(testItem.buildAsText(valueHostsManager, [])).toBe('');
        expect(testItem.buildAsText(valueHostsManager, null as unknown as IssueFound[])).toBe('');
    });

    test('Joins all individual messages using the default separator', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorMessage: '<strong>First</strong> issue' }),
            createIssue({ errorMessage: 'Second <em>issue</em>' })
        ];

        expect(testItem.buildAsText(valueHostsManager, issues)).toBe('First issue • Second issue');
    });

    test('Uses summary messages when requested and falls back to individual messages', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorMessage: 'Nearby one', summaryMessage: 'Summary one' }),
            createIssue({ errorMessage: 'Nearby two' })
        ];

        expect(testItem.buildAsText(valueHostsManager, issues, true))
            .toBe('Summary one • Nearby two');
    });

    test('Uses a caller-supplied separator including an empty separator', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorMessage: 'First' }),
            createIssue({ errorMessage: 'Second' })
        ];

        expect(testItem.buildAsText(valueHostsManager, issues, false, '\n'))
            .toBe('First\nSecond');
        expect(testItem.buildAsText(valueHostsManager, issues, false, ''))
            .toBe('FirstSecond');
    });

    test('Limits the joined messages to the requested positive count', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorMessage: 'First' }),
            createIssue({ errorMessage: 'Second' }),
            createIssue({ errorMessage: 'Third' })
        ];

        expect(testItem.buildAsText(valueHostsManager, issues, false, ' | ', 2))
            .toBe('First | Second');
    });

    test('Includes all messages when the limit is omitted, zero, negative, or larger than the collection', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorMessage: 'First' }),
            createIssue({ errorMessage: 'Second' })
        ];

        expect(testItem.buildAsText(valueHostsManager, issues)).toBe('First • Second');
        expect(testItem.buildAsText(valueHostsManager, issues, false, ' • ', 0)).toBe('First • Second');
        expect(testItem.buildAsText(valueHostsManager, issues, false, ' • ', -1)).toBe('First • Second');
        expect(testItem.buildAsText(valueHostsManager, issues, false, ' • ', 5)).toBe('First • Second');
    });

    test('Converts selected HTML messages to plain text before joining and preserves the plain-text separator', () => {
        let { testItem, valueHostsManager } = setup();
        let issues = [
            createIssue({ errorMessage: '<b>First</b> &amp; one' }),
            createIssue({ errorMessage: '<span>Second</span> issue' })
        ];

        expect(testItem.buildAsText(valueHostsManager, issues, false, '<hr>'))
            .toBe('First & one<hr>Second issue');
    });

    test('Uses the subclass ordering hook before limiting text results without changing the input array', () => {
        let { domServices, valueHostsManager } = setup();
        let testItem = new ReverseOrderedIssuesFoundFormatterService(domServices);
        let firstIssue = createIssue({ errorMessage: '<b>First</b>' });
        let secondIssue = createIssue({ errorMessage: '<i>Second</i>' });
        let thirdIssue = createIssue({ errorMessage: '<span>Third</span>' });
        let issues = [firstIssue, secondIssue, thirdIssue];

        expect(testItem.buildAsText(valueHostsManager, issues, false, ' / ', 2))
            .toBe('Third / Second');
        expect(issues).toEqual([firstIssue, secondIssue, thirdIssue]);
    });

    test('Does not modify issue objects while producing plain text', () => {
        let { testItem, valueHostsManager } = setup();
        let firstIssue = createIssue({
            errorCode: 'First',
            severity: ValidationSeverity.Warning,
            valueHostName: 'FirstName',
            errorMessage: '<b>First</b>',
            summaryMessage: '<strong>First summary</strong>'
        });
        let secondIssue = createIssue({
            errorCode: 'Second',
            severity: ValidationSeverity.Severe,
            errorMessage: '<i>Second</i>',
            summaryMessage: 'Second summary'
        });
        let issues = [firstIssue, secondIssue];
        let originalFirstIssue = { ...firstIssue };
        let originalSecondIssue = { ...secondIssue };

        testItem.buildAsText(valueHostsManager, issues, true);

        expect(firstIssue).toEqual(originalFirstIssue);
        expect(secondIssue).toEqual(originalSecondIssue);
        expect(issues[0]).toBe(firstIssue);
        expect(issues[1]).toBe(secondIssue);
    });
});
