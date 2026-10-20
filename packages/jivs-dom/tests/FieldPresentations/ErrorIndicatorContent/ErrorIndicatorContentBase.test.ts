/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ErrorIndicatorContentBase } from '../../../src/FieldPresentations/ErrorIndicatorContent/ErrorIndicatorContentBase';

/**
 * Concrete test subject that records the inputs passed to child-content generation.
 */
class TestErrorIndicatorContent extends ErrorIndicatorContentBase
{
    public childContentCalls: {
        issuesFound: IssueFound[];
        valueHostsManager: IValueHostsManager;
        fieldValueHost: IFieldValueHost | null;
    }[] = [];

    public constructor(
        private readonly childHtml: string,
        private readonly additionalClass?: string
    )
    {
        super();
    }

    protected override getGlobalOptions(): object | undefined
    {
        return undefined;
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        if (this.additionalClass)
            list.push(this.additionalClass);
    }

    protected override getChildContentHtml(
        issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null
    ): string
    {
        this.childContentCalls.push({
            issuesFound: issuesFound,
            valueHostsManager: valueHostsManager,
            fieldValueHost: fieldValueHost
        });
        return this.childHtml;
    }
}

// apply() owns the inner wrapper and child HTML, while leaving the caller's container unchanged.
describe('ErrorIndicatorContentBase.apply', () => {
    test('Adds the default persistent class and replaces the container contents', () => {
        let testItem = new TestErrorIndicatorContent('<span>Problem</span>');
        let containerElement = document.createElement('div');
        containerElement.className = 'caller-owned';
        containerElement.innerHTML = '<p>Previous content</p>';

        testItem.apply(
            containerElement,
            [],
            {} as unknown as IValueHostsManager,
            null
        );

        expect(containerElement.className).toBe('caller-owned');
        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-errorindicatorcontent"><span>Problem</span></div>'
        );
    });

    test('Forwards the issues, manager, and nullable field host to child-content generation', () => {
        let testItem = new TestErrorIndicatorContent('');
        let issuesFound = [] as IssueFound[];
        let valueHostsManager = {} as unknown as IValueHostsManager;
        let fieldValueHost = {} as unknown as IFieldValueHost;

        testItem.apply(
            document.createElement('div'),
            issuesFound,
            valueHostsManager,
            fieldValueHost
        );
        testItem.apply(
            document.createElement('div'),
            issuesFound,
            valueHostsManager,
            null
        );

        expect(testItem.childContentCalls).toHaveLength(2);
        expect(testItem.childContentCalls[0].issuesFound).toBe(issuesFound);
        expect(testItem.childContentCalls[0].valueHostsManager).toBe(valueHostsManager);
        expect(testItem.childContentCalls[0].fieldValueHost).toBe(fieldValueHost);
        expect(testItem.childContentCalls[1].fieldValueHost).toBeNull();
    });

    test('Includes persistent classes added by an override after the default class', () => {
        let testItem = new TestErrorIndicatorContent('', 'custom-indicator');
        let containerElement = document.createElement('div');

        testItem.apply(
            containerElement,
            [],
            {} as unknown as IValueHostsManager,
            null
        );

        expect(containerElement.firstElementChild?.className).toBe(
            'jivs-errorindicatorcontent custom-indicator'
        );
    });

    test('Replaces prior generated content on repeated calls, including when child HTML is empty', () => {
        let testItem = new TestErrorIndicatorContent('');
        let containerElement = document.createElement('div');

        testItem.apply(
            containerElement,
            [],
            {} as unknown as IValueHostsManager,
            null
        );
        testItem.apply(
            containerElement,
            [],
            {} as unknown as IValueHostsManager,
            null
        );

        expect(containerElement.children).toHaveLength(1);
        expect(containerElement.innerHTML).toBe('<div class="jivs-errorindicatorcontent"></div>');
    });
});
