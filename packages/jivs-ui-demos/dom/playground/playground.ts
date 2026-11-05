import '@plblum/jivs-dom/assets/jivs-dom.css';
import 'tippy.js/dist/tippy.css';
import './playground.css';

import { html_beautify } from 'js-beautify';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { ValueHostRulesBase } from '@plblum/jivs-builder/build/ValueHostRules/ValueHostRules';
import type { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IFieldPresentation } from '@plblum/jivs-dom/build/Interfaces/FieldPresentations';
import type { IPresentationFactory } from '@plblum/jivs-dom/build/Interfaces/Presentations_common';
import { FormInstaller } from '@plblum/jivs-dom/build/FormInstaller/FormInstaller';
import { EditorReader } from '@plblum/jivs-dom/build/Editors/EditorReader';
import { SimpleDomElementCollector } from '@plblum/jivs-dom/build/SimpleDom/SimpleDomElementCollector';
import { MessageFrame } from '@plblum/jivs-dom/build/Presentations_common/MessageFrame';
import { IconMessageFrame } from '@plblum/jivs-dom/build/Presentations_common/IconMessageFrame';
import { HeaderFooterMessageFrame } from '@plblum/jivs-dom/build/Presentations_common/HeaderFooterMessageFrame';
import { InlineErrorMessageDisplayPresentation } from '@plblum/jivs-dom/build/FieldPresentations/InlineErrorMessageDisplayPresentation';
import { PopupErrorMessageDisplayPresentation } from '@plblum/jivs-dom/build/FieldPresentations/PopupErrorMessageDisplayPresentation';
import { ColumnarErrorIndicatorContent } from '@plblum/jivs-dom/build/FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent';
import { LabelPresentation } from '@plblum/jivs-dom/build/FieldPresentations/LabelPresentation';
import { FieldContainerPresentation } from '@plblum/jivs-dom/build/FieldPresentations/FieldContainerPresentation';
import { ValueHostRulesOptions } from '@plblum/jivs-builder/build/Interfaces/ValueHostRules';
import { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { EditorFocusTrigger } from '@plblum/jivs-dom/build/Presentations_common/EditorFocusTrigger';

import { RequiredIndicatorPresentation } from '@plblum/jivs-dom/build/FieldPresentations/RequiredIndicatorPresentation';

import { createJivsServices } from '../../src/jivs-setup/create_JivsServices';
import { configureJivsDom } from '../../src/jivs-setup/configureJivsDom';


/**
 * THE JIVS SETUP A TYPICAL FORM NEEDS. Everything else in this file exists only to drive the playground's controls.
 *
 * Order matters. Services must be fully configured (including the jivs-dom presentations) before they are
 * handed to the rules, the ValueHostsManager and FormInstaller that use them:
 *  1. Create the services (jivs-engine), then connect jivs-dom to them.
 *  2. Describe the validation rules for the form and create the ValueHostsManager from them.
 *  3. FormInstaller walks the HTML, finds elements tagged with data-jivs-role, and attaches editors,
 *     presentations and dispatchers to the matching ValueHosts.
 *  4. EditorReader copies whatever the editors already contain into the ValueHosts. Without it,
 *     an untouched field has no value (undefined), so Require rules cannot tell it is empty.
 *     It also performs a preliminary validation.
 *
 * @param settings The playground settings that choose which rules and presentations to use.
 * @returns the ValueHostsManager, which is what you call validate() on when the user submits.
 */
function formalJivsSetupProcess(settings: PlaygroundSettings): ValueHostsManager
{
    // 1. Services. createJivsServices() and configureJivsDom() are normally one setup function in your app.
    const services = createJivsServices('en-US');
    configureJivsDom(services);
    // Normally part of configureJivsDom(): the named presentations that elements pick with data-jivs-presentation.
    registerExamplePresentations(services.domServices.fieldPresentationFactory);

    // 2. Rules and the manager. containerIdentifier limits FormInstaller to this form's HTML.
    const config = new PlaygroundFormRules(services, settings).configure();
    config.containerIdentifier = '#preview-gallery';    // only needed if you have multiple forms on the page, but we are showing it here anyway.
    const manager = new ValueHostsManager(config);

    // 3. Connect the HTML to the ValueHosts.
    FormInstaller.install(manager, new SimpleDomElementCollector());

    // 4. Initialize values from the editors.
    new EditorReader(manager).read();
    return manager;
}

/**
 * The rules for the form, written with the fluent builder. A real form lists its fields in configureRules().
 * This one builds a single field whose editor and messages follow the playground controls.
 */
class PlaygroundFormRules extends ValueHostRulesBase
{
    constructor(services: IJivsServices, private readonly _settings: PlaygroundSettings)
    {
        super(services);
    }

    public override configure(options?: ValueHostRulesOptions): ValueHostsManagerConfig
    {
        if (!options)
            options = {};
        // ValueHostRulesBase caches the configuration after the first call. That suits a form whose rules never change.
        // This one changes with the controls, so caching is turned off.
        options.disableCache = true;
        return super.configure(options);
    }

    protected override configureRules(builder: IValueHostsManagerConfigBuilder): void
    {
        const editor = editors[this._settings.editor];
        const fieldName = fieldNameOf(this._settings.example);
        // The field name ties the rules to the HTML: elements carry the same name in data-field.
        const field = builder.field(fieldName, editor.lookupKey as LookupKey);
        if (this._settings.editor === 'checkbox')
        {
            // A checkbox holds a Boolean, so the rule compares it to true.
            field.equalTo(true, 'You must accept the terms.');
            if (this._settings.allMessages)
                field.equalTo(true, { errorMessage: 'Acceptance is required before continuing.', errorCode: 'AcceptRequired' });
            return;
        }
        const rules = this._settings.allMessages ? editor.rules : editor.rules.slice(0, 1);
        // requireText fails on an empty editor. It belongs to the Require category, which preliminary validation skips.
        if (this._settings.editor === 'text' || this._settings.editor === 'textarea')
            field.requireText();
        else if (this._settings.editor === 'radio')
            field.requireText({ errorMessage: 'Choose a contact method.' });
        else if (this._settings.editor === 'select')
            field.requireText({ errorMessage: 'Choose a country.' });
        // Each validator on a field needs its own errorCode.
        rules.forEach((rule, i) =>
            field.regExp(rule.pattern, {
                errorMessage: rule.message, errorCode: `PG_${ this._settings.editor }_${ i }`,
                // regExp defaults to Severe, which stops evaluating later validators.
                severity: ValidationSeverity.Error
            }));
    }
}

// The Required Indicator hosts the jivs-validated and jivs-corrected visuals through its ::after.
// Editors cannot, because ::after does not render on input, select or textarea.
const requiredIndicatorPresentationName = 'pgRequired';

const labelPresentationName = 'pgLabel';
const fieldContainerPresentationName = 'pgFieldContainer';

function registerRolePresentations(factory: IPresentationFactory<IFieldPresentation>): void
{
    factory.register(labelPresentationName, (element) =>
        new LabelPresentation(element));
    factory.register(requiredIndicatorPresentationName, (element) =>
        new RequiredIndicatorPresentation(element, { validatedClassEnabled: true, correctedClassEnabled: true }));
    factory.register(fieldContainerPresentationName, (element) =>
        new FieldContainerPresentation(element));
}

function registerExamplePresentations(factory: IPresentationFactory<IFieldPresentation>): void
{
    registerRolePresentations(factory);
    const frames: Record<FrameKind, () => MessageFrame | IconMessageFrame | HeaderFooterMessageFrame> = {
        message: () => new MessageFrame(),
        headerFooter: () => new HeaderFooterMessageFrame({ headerHtml: 'Please fix:', footerHtml: 'Then try again.' }),
        iconCss: () => new IconMessageFrame(),
        iconContent: () => new IconMessageFrame({ iconContent: '&#9888;', headerHtml: 'Check this field' })
    };
    const indicators: Record<IndicatorKind, object> = {
        icon: { column2Html: '', column3Html: '', column2Htmll10n: '', column3Htmll10n: '' },
        text: { column3Html: '', column3Htmll10n: '' },
        arrow: {}
    };
    const popupMechanismOptions = {
        placement: 'bottom-start' as const,
        interactive: true,
        appendTo: () => document.body
    };

    for (const example of examples)
    {
        if (example.frame)
        {
            const frame = example.frame;
            factory.register(example.presentationName, (element) =>
                new InlineErrorMessageDisplayPresentation(element, frames[frame](), { variationClasses: example.variations }));
        }
        else if (example.popupIndicator)
        {
            const indicator = example.popupIndicator;
            factory.register(example.presentationName, (element) =>
                new PopupErrorMessageDisplayPresentation(
                    element,
                    new ColumnarErrorIndicatorContent(indicators[indicator]),
                    new MessageFrame(),
                    popupMechanismOptions,
                    {
                        variationClasses: example.variations,
                        popupOnHover: true,
                        popupOnFocusInEditor: true,
                        popupOnHoverOverEditor: true
                     }));
        }
    }
}

/*
 * Everything below only builds this page's form and wires its controls. It is not part of a typical Jivs setup.
 */

type EditorKind = 'text' | 'select' | 'textarea' | 'checkbox' | 'radio';

interface PlaygroundSettings
{
    example: Example;
    allMessages: boolean;
    editor: EditorKind;
    sideBySide: boolean;
    roleDestinations: {
        label: boolean;
        required: boolean;
        container: boolean;
    };
}

type FrameKind = 'message' | 'headerFooter' | 'iconCss' | 'iconContent';
type IndicatorKind = 'icon' | 'text' | 'arrow';

interface Example
{
    id: string;
    title: string;
    description: string;
    presentationName: string;
    frame?: FrameKind;
    popupIndicator?: IndicatorKind;
    variations: string[];
    registrationCode: string;
}

const examples: Example[] = [
    {
        id: 'basic', title: 'Basic MessageFrame',
        description: 'The Presentation Container is also the Message Frame and Message Content container.',
        presentationName: 'previewBasicErrors', frame: 'message', variations: [],
        registrationCode: "new InlineErrorMessageDisplayPresentation(element, new MessageFrame())"
    },
    {
        id: 'accent', title: 'Accent appearance',
        description: 'Adds the supplied accent variation to the Inline Error Message Display container.',
        presentationName: 'previewAccentErrors', frame: 'message',
        variations: ['jivs-inlineerrormessagedisplay-variant-accent'],
        registrationCode: "new InlineErrorMessageDisplayPresentation(element, new MessageFrame(),\n    { variationClasses: ['jivs-inlineerrormessagedisplay-variant-accent'] })"
    },
    {
        id: 'panel', title: 'Panel appearance',
        description: 'Adds the supplied panel variation to the Inline Error Message Display container.',
        presentationName: 'previewPanelErrors', frame: 'message',
        variations: ['jivs-inlineerrormessagedisplay-variant-panel'],
        registrationCode: "new InlineErrorMessageDisplayPresentation(element, new MessageFrame(),\n    { variationClasses: ['jivs-inlineerrormessagedisplay-variant-panel'] })"
    },
    {
        id: 'header-footer', title: 'HeaderFooterMessageFrame',
        description: 'Generates a layout frame containing a header, Message Content, and footer.',
        presentationName: 'previewHeaderFooterErrors', frame: 'headerFooter',
        variations: ['jivs-inlineerrormessagedisplay-variant-panel'],
        registrationCode: "new InlineErrorMessageDisplayPresentation(element,\n    new HeaderFooterMessageFrame({ headerHtml: 'Please fix:', footerHtml: 'Then try again.' }),\n    { variationClasses: ['jivs-inlineerrormessagedisplay-variant-panel'] })"
    },
    {
        id: 'icon-css', title: 'IconMessageFrame without a header',
        description: 'Leaves the icon span empty so jivs-dom.css supplies its glyph through .jivs-icon:empty::after.',
        presentationName: 'previewCssIconErrors', frame: 'iconCss',
        variations: ['jivs-inlineerrormessagedisplay-variant-panel'],
        registrationCode: "new InlineErrorMessageDisplayPresentation(element, new IconMessageFrame(),\n    { variationClasses: ['jivs-inlineerrormessagedisplay-variant-panel'] })"
    },
    {
        id: 'icon-content', title: 'IconMessageFrame with a header',
        description: 'Supplies iconContent and a header above the Message Content in the second column.',
        presentationName: 'previewContentIconErrors', frame: 'iconContent',
        variations: ['jivs-inlineerrormessagedisplay-variant-panel'],
        registrationCode: "new InlineErrorMessageDisplayPresentation(element,\n    new IconMessageFrame({ iconContent: '&#9888;', headerHtml: 'Check this field' }),\n    { variationClasses: ['jivs-inlineerrormessagedisplay-variant-panel'] })"
    },
    {
        id: 'popup-icon', title: 'Popup: warning icon only',
        description: 'ColumnarErrorIndicatorContent with just the icon. Click the indicator to open the Tippy popup.',
        presentationName: 'previewPopupIcon', popupIndicator: 'icon', variations: [],
        registrationCode: "new PopupErrorMessageDisplayPresentation(element,\n    new ColumnarErrorIndicatorContent({ column2Html: '', column3Html: '' }),\n    new MessageFrame(), popupMechanismOptions,\n    { popupOnHover: true, popupOnFocusInEditor: true})"
    },
    {
        id: 'popup-text', title: 'Popup: icon and text',
        description: 'Adds descriptive text in column 2. Test typography, alignment, hover, and keyboard focus.',
        presentationName: 'previewPopupText', popupIndicator: 'text', variations: [],
        registrationCode: "new PopupErrorMessageDisplayPresentation(element,\n    new ColumnarErrorIndicatorContent({ column3Html: '' }),\n    new MessageFrame(), popupMechanismOptions,\n    { popupOnHover: true, popupOnFocusInEditor: true })"
    },
    {
        id: 'popup-arrow', title: 'Popup: icon, text, and arrow',
        description: 'Populates all three columns, with independent typography and hover styling.',
        presentationName: 'previewPopupArrow', popupIndicator: 'arrow', variations: [],
        registrationCode: "new PopupErrorMessageDisplayPresentation(element,\n    new ColumnarErrorIndicatorContent({}),\n    new MessageFrame(), popupMechanismOptions,\n    { popupOnHover: true, popupOnFocusInEditor: true })"
    },
    {
        id: 'popup-button', title: 'Popup: Button variation',
        description: 'Rounded-rectangle appearance with border, padding, tinted background, and hover background.',
        presentationName: 'previewPopupButton', popupIndicator: 'text',
        variations: ['jivs-popuperrormessagedisplay-variant-button'],
        registrationCode: "new PopupErrorMessageDisplayPresentation(element,\n    new ColumnarErrorIndicatorContent({ column3Html: '' }),\n    new MessageFrame(), popupMechanismOptions,\n    { variationClasses: ['jivs-popuperrormessagedisplay-variant-button'], popupOnHover: true, popupOnFocusInEditor: true })"
    },
    {
        id: 'popup-pill', title: 'Popup: Pill variation',
        description: 'Fully rounded appearance with the same shared treatment as Button, with a trailing arrow.',
        presentationName: 'previewPopupPill', popupIndicator: 'arrow',
        variations: ['jivs-popuperrormessagedisplay-variant-pill'],
        registrationCode: "new PopupErrorMessageDisplayPresentation(element,\n    new ColumnarErrorIndicatorContent({}),\n    new MessageFrame(), popupMechanismOptions,\n    { variationClasses: ['jivs-popuperrormessagedisplay-variant-pill'], popupOnHover: true, popupOnFocusInEditor: true })"
    }
];

interface EditorDefinition
{
    label: string;
    lookupKey: string;
    // Every rule fails for invalidValue and passes for validValue.
    rules: Array<{ pattern: RegExp; message: string }>;
    invalidValue: string;
    validValue: string;
    markup(fieldName: string): string;
}

const editors: Record<EditorKind, EditorDefinition> = {
    text: {
        label: 'Display name', lookupKey: LookupKey.String,
        rules: [
            { pattern: /^.{3,}$/, message: 'Enter at least 3 characters.' },
            { pattern: /^[a-z]+$/, message: 'Use letters only.' }
        ],
        invalidValue: 'a1', validValue: 'abc',
        markup: (f) => `<input id="${ f }_editor" type="text" autocomplete="off" data-jivs-role="editor" data-field="${ f }">`
    },
    select: {
        label: 'Country', lookupKey: LookupKey.String,
        rules: [
            { pattern: /^(?!CA$)/, message: 'Canada is not supported yet.' },
            { pattern: /^US$/, message: 'Only United States is available right now.' }
        ],
        invalidValue: 'CA', validValue: 'US',
        markup: (f) => `<select id="${ f }_editor" data-jivs-role="editor" data-field="${ f }">` +
            '<option value="">Select a country</option><option value="US">United States</option><option value="CA">Canada</option></select>'
    },
    textarea: {
        label: 'Comments', lookupKey: LookupKey.String,
        rules: [
            { pattern: /^.{20,}$/, message: 'Write at least 20 characters.' },
            { pattern: /^[^!]*$/, message: 'Do not use exclamation marks.' }
        ],
        invalidValue: 'short!', validValue: 'This comment is long enough.',
        markup: (f) => `<textarea id="${ f }_editor" data-jivs-role="editor" data-field="${ f }"></textarea>`
    },
    checkbox: {
        label: 'Accept terms', lookupKey: LookupKey.Boolean,
        rules: [],
        invalidValue: 'false', validValue: 'true',
        markup: (f) => `<label><input id="${ f }_editor" type="checkbox" value="true" data-jivs-role="editor" data-field="${ f }"> I agree to the terms</label>`
    },
    radio: {
        label: 'Preferred contact', lookupKey: LookupKey.String,
        rules: [
            { pattern: /^phone$/, message: 'Phone is the only supported contact method.' },
            { pattern: /^(?!email$)/, message: 'Email is not available.' }
        ],
        invalidValue: 'email', validValue: 'phone',
        markup: (f) => '<div class="preview-choice-list">' +
            `<input id="${ f }_editor" type="radio" name="${ f }_group" value="email" data-jivs-role="editor" data-field="${ f }"><label for="${ f }_editor">Email</label>` +
            `<input id="${ f }_phone" type="radio" name="${ f }_group" value="phone"><label for="${ f }_phone">Phone</label></div>`
    }
};

function fieldNameOf(example: Example): string
{
    return 'pg_' + example.id.replace(/-/g, '_');
}

function getSettings(): PlaygroundSettings
{
    const exampleId = (document.getElementById('preview-example') as HTMLSelectElement).value;
    return {
        example: examples.find((e) => e.id === exampleId) ?? examples[0],
        allMessages: (document.getElementById('preview-multiple') as HTMLInputElement).checked,
        editor: (document.getElementById('preview-editor') as HTMLSelectElement).value as EditorKind,
        sideBySide: document.querySelector<HTMLInputElement>('input[name="preview-orientation"]:checked')!.value === 'side-by-side',
        roleDestinations: {
            label: (document.getElementById('preview-role-label') as HTMLInputElement).checked,
            required: (document.getElementById('preview-role-required') as HTMLInputElement).checked,
            container: (document.getElementById('preview-role-container') as HTMLInputElement).checked
        }
    };
}

function escapeHtml(text: string): string
{
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function buildGalleryMarkup(settings: PlaygroundSettings): string
{
    const editor = editors[settings.editor];
    const orientation = settings.sideBySide ? 'preview-field-side-by-side' : 'preview-field-stacked';
    const example = settings.example;
    const f = fieldNameOf(example);
    const attrs = `data-field="${ f }"`;
    // An element that is not opted in has no data-jivs-role, so Jivs ignores it completely.
    const roleAttribute = (optedIn: boolean, role: string, presentationName: string) =>
        optedIn ? `data-jivs-role="${ role }" ${ attrs } data-jivs-presentation="${ presentationName }"` : '';
    // Each sample is only the instantiation; the comment ties it to the HTML attributes.
    const sample = (role: string, presentationName: string, code: string) =>
        `// data-jivs-role="${ role }" data-jivs-presentation="${ presentationName }"\n${ code }`;
    const registrationCode = [
        sample('error', example.presentationName, example.registrationCode),
        settings.roleDestinations.label
            ? sample('label', labelPresentationName, 'new LabelPresentation(element)')
            : null,
        settings.roleDestinations.required
            ? sample('required', requiredIndicatorPresentationName, 'new RequiredIndicatorPresentation(element,\n    { validatedClassEnabled: true, correctedClassEnabled: true })')
            : null,
        settings.roleDestinations.container
            ? sample('container', fieldContainerPresentationName, 'new FieldContainerPresentation(element)')
            : null
    ].filter((code): code is string => code !== null).join('\n\n');
    return `<article id="example-${ example.id }" class="preview-example" data-example-id="${ example.id }">
<div class="preview-example-heading"><h2>${ escapeHtml(example.title) }</h2><p>${ escapeHtml(example.description) }</p></div>
<div class="preview-specimen">
<div ${ roleAttribute(settings.roleDestinations.container, 'container', fieldContainerPresentationName) } class="preview-field ${ orientation }">
<div class="preview-label-zone"><label ${ roleAttribute(settings.roleDestinations.label, 'label', labelPresentationName) } for="${ f }_editor">${ escapeHtml(editor.label) }</label></div>
<div class="preview-control-zone">
<div class="preview-input-row"><div class="preview-editor-slot">${ editor.markup(f) }</div>
<div class="preview-required-slot"><span ${ roleAttribute(settings.roleDestinations.required, 'required', requiredIndicatorPresentationName) }></span></div></div>
<div class="preview-error-slot"><div data-jivs-role="error" ${ attrs } data-jivs-presentation="${ example.presentationName }"></div></div>
</div></div></div>
<div class="preview-docs">
<details open><summary>Current Jivs-SimpleDOM HTML</summary><div class="preview-code-wrap"><pre><code data-html-code></code></pre></div></details>
<details><summary>Factory registration</summary><div class="preview-code-wrap"><p>Registered with the field presentation factory before FormInstaller runs. Each comment is the name used by data-jivs-presentation.</p><pre><code>${ escapeHtml(registrationCode) }</code></pre></div></details>
<details><summary>CSS classes in use</summary><div class="preview-code-wrap"><p>Locate these names in jivs-dom.css.</p><ul class="preview-class-list" data-class-list></ul></div></details>
</div></article>`;
}

// Simulates the user so the real editor to ValueHost path runs.
function userSetsEditor(fieldName: string, kind: EditorKind, value: string): void
{
    const root = document.getElementById('preview-gallery')!;
    const editor = root.querySelector<HTMLInputElement>(`[data-jivs-role="editor"][data-field="${ fieldName }"]`)!;
    if (kind === 'checkbox')
        editor.checked = value === 'true';
    else if (kind === 'radio')
    {
        const radio = root.querySelector<HTMLInputElement>(`input[name="${ fieldName }_group"][value="${ value }"]`)!;
        radio.checked = true;
        // radio.dispatchEvent(new Event('change', { bubbles: true }));
        // return;
    }
    else
        editor.value = value;
//    editor.dispatchEvent(new Event('change', { bubbles: true }));
    vhm?.getFieldValueHost(fieldName)?.setTextValue(value, { reset: true });
}

function describeClasses(article: HTMLElement): void
{
    const classes = new Set<string>();
    article.querySelectorAll('.preview-specimen [class]').forEach((el) =>
        el.classList.forEach((c) => { if (c.startsWith('jivs-')) classes.add(c); }));
    const list = article.querySelector('[data-class-list]')!;
    list.innerHTML = classes.size
        ? Array.from(classes).sort().map((c) => `<li><code>.${ escapeHtml(c) }</code></li>`).join('')
        : '<li class="preview-class-empty">No Jivs CSS classes are present.</li>';
    article.querySelector('[data-html-code]')!.textContent =
        html_beautify(article.querySelector('.preview-specimen')!.innerHTML,
            { indent_size: 2, wrap_line_length: 100, inline: [] });
}

let vhm: ValueHostsManager | null = null;
let specimenObserver: MutationObserver | null = null;

function rebuild(): void
{
    const settings = getSettings();
    specimenObserver?.disconnect();
    // Closes popups left open by the previous build.
    document.querySelectorAll('[data-tippy-root]').forEach((el) => el.remove());

    const gallery = document.getElementById('preview-gallery')!;
    gallery.innerHTML = buildGalleryMarkup(settings);

    vhm = formalJivsSetupProcess(settings);

    // Validation changes classes and content in the specimen; keep the reports current.
    const article = gallery.querySelector<HTMLElement>('.preview-example')!;
    specimenObserver = new MutationObserver(() => describeClasses(article));
    specimenObserver.observe(article.querySelector('.preview-specimen')!,
        { subtree: true, childList: true, attributes: true, characterData: true });
    describeClasses(article);
}


// The editor's change event validates, so entering values drives the same path as a real user.
function enterSample(valid: boolean): void
{
    const settings = getSettings();
    const editor = editors[settings.editor];
    userSetsEditor(fieldNameOf(settings.example), settings.editor, valid ? editor.validValue : editor.invalidValue);
}

function applyOrientation(): void
{
    const sideBySide = getSettings().sideBySide;
    const field = document.querySelector('#preview-gallery .preview-field');
    field?.classList.toggle('preview-field-side-by-side', sideBySide);
    field?.classList.toggle('preview-field-stacked', !sideBySide);
}

function buildExampleSelector(): void
{
    const select = document.getElementById('preview-example') as HTMLSelectElement;
    const group = (label: string, list: Example[]) =>
        `<optgroup label="${ label }">${ list.map((e) => `<option value="${ e.id }">${ escapeHtml(e.title) }</option>`).join('') }</optgroup>`;
    select.innerHTML = group('Inline error messages', examples.filter((e) => e.frame))
        + group('Popup error messages', examples.filter((e) => e.popupIndicator));
}

buildExampleSelector();
for (const id of ['preview-example', 'preview-editor', 'preview-multiple',
    'preview-role-label', 'preview-role-required', 'preview-role-container'])
    document.getElementById(id)!.addEventListener('change', () =>
    { rebuild(); enterSample(false); });
document.getElementById('preview-reset')!.addEventListener('click', () =>
{
    vhm?.clearValidation();
    userSetsEditor(fieldNameOf(getSettings().example), getSettings().editor, '');
});
document.querySelectorAll('input[name="preview-orientation"]').forEach((el) =>
    el.addEventListener('change', applyOrientation));
document.getElementById('preview-fill-invalid')!.addEventListener('click', () =>
    enterSample(false));
document.getElementById('preview-fill-valid')!.addEventListener('click', () =>
    enterSample(true));
document.getElementById('preview-validate')!.addEventListener('click', () =>
    vhm?.validate());
document.getElementById('preview-validate-preliminary')!.addEventListener('click', () =>
{
    vhm?.clearValidation(); // because prelim intentionally skips trying anything on fields that have existing validation issues
    vhm?.validate({ preliminary: true });
});
rebuild();
enterSample(false);
