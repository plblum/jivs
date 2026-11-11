/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { SetValueOptions } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { PlaceholderTextValueAdapter } from '../../src/Adapters/PlaceholderTextValueAdapter';
import { PlaceholderAdapterDefinition } from '../../src/EditorAdapterDefinitions/PlaceholderAdapterDefinition';
import { defaultPlaceholderPresentationName } from '../../src/FieldPresentations/PlaceholderPresentation';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import { createStubFieldValueHost } from '../TestSupport/mocks';

class Publicify_PlaceholderAdapterDefinition extends PlaceholderAdapterDefinition
{
    public publicify_attachToSendValuesCore(
        valueHost: IFieldValueHost,
        editor: HTMLElement,
        jivsElement: IJivsElement,
        options: EditorInstallOptions
    ): void
    {
        this.attachToSendValuesCore(valueHost, editor, jivsElement, options);
    }
}

function createValueHost(undefinedText: string = 'Waiting for values'): IFieldValueHost
{
    return {
        ...createStubFieldValueHost('CalculatedField'),
        textForUndefinedCalculationValue: () => undefinedText
    };
}

// PlaceholderAdapterDefinition retains its adapter identity and recommends its registered presentation by default.
describe('PlaceholderAdapterDefinition constructor', () => {
    test('Uses the configured key, priority, default supported tag, and placeholder presentation', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder', 25);

        expect(adapterDefinition.adapterKey).toBe('placeholder');
        expect(adapterDefinition.priority).toBe(25);
        expect(adapterDefinition.recommendedFieldPresentationName).toBe(defaultPlaceholderPresentationName);
    });

    test('Accepts one supported tag and a custom presentation name', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder:div', 10, 'div', 'custom');

        expect(adapterDefinition.recommendedFieldPresentationName).toBe('custom');
        expect(adapterDefinition.matches(createValueHost(), document.createElement('div'))).toBe(true);
    });

    test('Accepts multiple supported tags and allows the default presentation to be disabled', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder:content', 10, ['span', 'div'], null);

        expect(adapterDefinition.recommendedFieldPresentationName).toBeNull();
        expect(adapterDefinition.matches(createValueHost(), document.createElement('span'))).toBe(true);
        expect(adapterDefinition.matches(createValueHost(), document.createElement('div'))).toBe(true);
    });
});

// Matching is limited to configured tags whose textContent is empty or whitespace, so existing content is not overwritten.
describe('PlaceholderAdapterDefinition.matches', () => {
    test('Matches the default span tag when its text is empty or whitespace', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder', 25);
        let empty = document.createElement('span');
        let whitespace = document.createElement('span');
        whitespace.textContent = ' \n\t ';

        expect(adapterDefinition.matches(createValueHost(), empty)).toBe(true);
        expect(adapterDefinition.matches(createValueHost(), whitespace)).toBe(true);
    });

    test('Does not match unsupported tags or tags with existing text', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder', 25);
        let div = document.createElement('div');
        let populatedSpan = document.createElement('span');
        populatedSpan.textContent = 'Existing content';

        expect(adapterDefinition.matches(createValueHost(), div)).toBe(false);
        expect(adapterDefinition.matches(createValueHost(), populatedSpan)).toBe(false);
    });

    test('Does not match a tag whose name is not in the configured tag list', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder:div', 25, 'div');

        expect(adapterDefinition.matches(createValueHost(), document.createElement('span'))).toBe(false);
    });
});

// PlaceholderAdapterDefinition creates the textContent adapter while declining native value editing and send-value wiring.
describe('PlaceholderAdapterDefinition adapters and send-value methods', () => {
    test('Creates a PlaceholderTextValueAdapter that reads and updates the chosen tag', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder:div', 25, 'div');
        let valueHost = createValueHost('Not calculated');
        let element = document.createElement('div');
        let adapter = adapterDefinition.createTextValueAdapter(valueHost, element, null)!;

        expect(adapter).toBeInstanceOf(PlaceholderTextValueAdapter);
        adapter.writeTextValue('Calculated');
        expect(element.textContent).toBe('Calculated');
        expect(adapter.readTextValue()).toBe('Calculated');
        adapter.writeTextValue(undefined);
        expect(element.textContent).toBe('Not calculated');
    });

    test('Returns null when asked to create a native value adapter', () => {
        let adapterDefinition = new PlaceholderAdapterDefinition('placeholder', 25);

        expect(adapterDefinition.createValueAdapter(createValueHost(), document.createElement('span'), null)).toBeNull();
    });

    test('Does not attach events or send values because the placeholder is not user-editable', () => {
        let adapterDefinition = new Publicify_PlaceholderAdapterDefinition('placeholder', 25);
        let element = document.createElement('span');
        let sendValueCalls = 0;
        let valueHost = {
            ...createValueHost(),
            setTextValue: () => { sendValueCalls++; }
        };
        let jivsElement = element as IJivsElement;
        let options: EditorInstallOptions = {};
        let setValueOptions: SetValueOptions = {};

        expect(() => adapterDefinition.attachToSendValues(valueHost, element, jivsElement, options)).not.toThrow();
        expect(() => adapterDefinition.publicify_attachToSendValuesCore(
            valueHost,
            element,
            jivsElement,
            options
        )).not.toThrow();
        expect(() => adapterDefinition.sendValue(valueHost, element, jivsElement, setValueOptions)).not.toThrow();
        element.dispatchEvent(new Event('change'));

        expect(sendValueCalls).toBe(0);
    });
});
