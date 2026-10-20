/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IErrorMessagesService } from '@plblum/jivs-engine/build/Interfaces/ErrorMessagesService';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import {
    PresentationContentBase,
    PresentationContentBaseOptions
} from '../../src/Presentations_common/PresentationContentBase';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ITestOptions extends PresentationContentBaseOptions
{
    inheritedDefault?: string;
    shared?: { defaultValue?: string, globalValue?: string, instanceValue?: string };
    instanceOnly?: string;
    globalOnly?: string;
}

/**
 * Concrete test subject exposing the base's options, service, and text-resolution behavior.
 */
class Publicify_PresentationContentBase extends PresentationContentBase<ITestOptions>
{
    public constructor(options?: ITestOptions | null)
    {
        super(options ?? undefined);
    }

    public get publicify_options(): ITestOptions
    {
        return this.options;
    }

    public get publicify_domServices(): IJivsDomServices
    {
        return this.domServices;
    }

    public publicify_resolveText(
        key: string,
        defaultText: string,
        issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null
    ): string
    {
        return this.resolveText(key, defaultText, issuesFound, valueHostsManager, fieldValueHost);
    }

    protected override getOptionDefaults(): Partial<ITestOptions>
    {
        return {
            ...super.getOptionDefaults(),
            inheritedDefault: 'base default',
            shared: { defaultValue: 'base nested default' }
        };
    }

    protected override getGlobalOptions(): object | undefined
    {
        return (<JivsDomServiceGlobalOptionsExpanded>this.domServices.options).test;
    }
}

interface ILocalizeCall
{
    cultureId: string;
    key: string | null;
    fallback: string | null;
}

interface JivsDomServiceGlobalOptionsExpanded extends JivsDomGlobalOptions
{
    test: ITestOptions
}

/**
 * Creates the content object with configurable global options and localization behavior.
 */
function setup(options?: ITestOptions | null, localizedText?: string | null): {
    testItem: Publicify_PresentationContentBase,
    domServices: IJivsDomServices,
    localizationCalls: ILocalizeCall[]
}
{
    let localizationCalls: ILocalizeCall[] = [];
    let errorMessagesService = {
        localize: (cultureId: string, key: string | null, fallback: string | null): string | null => {
            localizationCalls.push({ cultureId: cultureId, key: key, fallback: fallback });
            return localizedText === undefined ? fallback : localizedText;
        }
    } as unknown as IErrorMessagesService;
    let engineServices = {
        errorMessagesService: errorMessagesService
    } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({
        services: engineServices,
        options: <JivsDomServiceGlobalOptionsExpanded>{
            ...createMockJivsDomServices().options,
            test: {
                inheritedDefault: 'global override',
                globalOnly: 'global value',
                shared: { globalValue: 'global nested value' }
            } as ITestOptions
        }
    });

    return {
        testItem: new Publicify_PresentationContentBase(options),
        domServices: domServices,
        localizationCalls: localizationCalls
    };
}

/**
 * Creates a manager supplying the active culture required for text localization.
 */
function createValueHostsManager(activeCultureId: string = 'en-US'): IValueHostsManager
{
    return {
        behaviors: { activeCultureId: activeCultureId }
    } as unknown as IValueHostsManager;
}

// Constructor options are shallow-copied so later top-level caller changes cannot replace the content's options.
describe('PresentationContentBase constructor', () => {
    test('Uses empty options when none or null are supplied', () => {
        let withoutOptions = new Publicify_PresentationContentBase();
        let withNullOptions = new Publicify_PresentationContentBase(null);
        let { domServices } = setup();

        withoutOptions.setDomServices(domServices);
        withNullOptions.setDomServices(domServices);

        expect(withoutOptions.publicify_options).toEqual({
            inheritedDefault: 'global override',
            shared: { globalValue: 'global nested value' },
            globalOnly: 'global value'
        });
        expect(withNullOptions.publicify_options).toEqual(withoutOptions.publicify_options);
    });

    test('Copies the top-level options while retaining nested option references', () => {
        let shared = { instanceValue: 'initial' };
        let suppliedOptions: ITestOptions = {
            instanceOnly: 'before',
            shared: shared
        };
        let testItem = new Publicify_PresentationContentBase(suppliedOptions);
        let { domServices } = setup();
        testItem.setDomServices(domServices);

        suppliedOptions.instanceOnly = 'after';
        shared.instanceValue = 'nested after';

        expect(testItem.publicify_options.instanceOnly).toBe('before');
        expect(testItem.publicify_options.shared).toBe(shared);
        expect(testItem.publicify_options.shared?.instanceValue).toBe('nested after');
    });
});

// domServices cannot be used until setDomServices has supplied the dependency.
describe('PresentationContentBase.domServices', () => {
    test('Throws a clear error before DOM services are initialized', () => {
        let testItem = new Publicify_PresentationContentBase();

        expect(() => testItem.publicify_domServices).toThrow('DOM services not initialized.');
    });
});

// setDomServices supplies service access and resolves options with instance values taking precedence.
describe('PresentationContentBase.setDomServices', () => {
    test('Merges defaults, global values, and instance values shallowly in precedence order', () => {
        let shared = { instanceValue: 'instance nested value' };
        let { testItem, domServices } = setup({
            inheritedDefault: 'instance override',
            shared: shared,
            instanceOnly: 'instance value'
        });

        testItem.setDomServices(domServices);

        expect(testItem.publicify_domServices).toBe(domServices);
        expect(testItem.publicify_options).toEqual({
            inheritedDefault: 'instance override',
            shared: shared,
            instanceOnly: 'instance value',
            globalOnly: 'global value'
        });
        expect(testItem.publicify_options.shared).toBe(shared);
        expect(testItem.publicify_options.shared?.globalValue).toBeUndefined();
    });

    test('Fills missing instance options from global options and then component defaults', () => {
        let { testItem, domServices } = setup();

        testItem.setDomServices(domServices);

        expect(testItem.publicify_options).toEqual({
            inheritedDefault: 'global override',
            shared: { globalValue: 'global nested value' },
            globalOnly: 'global value'
        });
    });

    test('Can resolve options from an absent global options group', () => {
        let domServices = createMockJivsDomServices({
            options: <JivsDomServiceGlobalOptionsExpanded>{
                ...createMockJivsDomServices().options,
                test: undefined as unknown as ITestOptions
            }
        });
        let testItem = new Publicify_PresentationContentBase({ instanceOnly: 'explicit' });

        testItem.setDomServices(domServices);

        expect(testItem.publicify_options).toEqual({
            inheritedDefault: 'base default',
            shared: { defaultValue: 'base nested default' },
            instanceOnly: 'explicit'
        });
    });
});

// resolveText localizes using the active culture, substitutes issue count and an encoded field label, and handles absent labels.
describe('PresentationContentBase.resolveText', () => {
    test('Uses culture and localization inputs, replaces count and label, and HTML-encodes the label', () => {
        let { testItem, domServices, localizationCalls } = setup(undefined, 'There are {Count} issues for {Label}.');
        testItem.setDomServices(domServices);
        let issues = [{ errorMessage: 'one' }, { errorMessage: 'two' }] as IssueFound[];
        let fieldValueHost = {
            getLabel: () => 'A <B> & "C"'
        } as unknown as IFieldValueHost;

        let result = testItem.publicify_resolveText(
            'issue-summary',
            'Found {Count} for {Label}',
            issues,
            createValueHostsManager('fr-CA'),
            fieldValueHost
        );

        expect(localizationCalls).toEqual([{
            cultureId: 'fr-CA',
            key: 'issue-summary',
            fallback: 'Found {Count} for {Label}'
        }]);
        expect(result).toBe('There are 2 issues for A &lt;B&gt; &amp; &quot;C&quot;.');
    });

    test('Leaves the label token unchanged when no field value host is supplied', () => {
        let { testItem, domServices } = setup(undefined, '{Count} issues for {Label}');
        testItem.setDomServices(domServices);

        expect(testItem.publicify_resolveText(
            'issue-summary',
            'Fallback {Count} {Label}',
            [{ errorMessage: 'one' }] as IssueFound[],
            createValueHostsManager(),
            null
        )).toBe('1 issues for {Label}');
    });

    test('Replaces the count with zero when the issue list is empty', () => {
        let { testItem, domServices } = setup(undefined, '{Count} issues');
        testItem.setDomServices(domServices);

        expect(testItem.publicify_resolveText(
            'empty',
            'Fallback',
            [],
            createValueHostsManager(),
            null
        )).toBe('0 issues');
    });

    test('Leaves the result empty when localization returns an empty string', () => {
        let { testItem, domServices } = setup(undefined, '');
        testItem.setDomServices(domServices);

        expect(testItem.publicify_resolveText(
            'empty',
            'Fallback',
            [],
            createValueHostsManager(),
            null
        )).toBe('');
    });

    test('Returns an empty string when localization returns null', () => {
        let { testItem, domServices } = setup(undefined, null);
        testItem.setDomServices(domServices);

        expect(testItem.publicify_resolveText(
            'missing',
            'Fallback',
            [],
            createValueHostsManager(),
            null
        )).toBe('');
    });
});
