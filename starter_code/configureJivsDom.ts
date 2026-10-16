/**
 * >> WHEN USING JIVS-DOM AND JIVS-SIMPLEDOM, ADD THIS ENTIRE FILE TO YOUR APP. <<
 * 
 * It contains the configureJivsDom() function which you will use to 
 * create and configure the JivsDomServices object, and to attach it as a service of
 * the JivsServices object.
 * Call it from the createJivsServices() function or wherever you set up your JivsServices instance.
 * 
 * It has extensive configuration options. Many have defaults.
 * 
 * Valuable info:
 * - JivsDomServices is stateless. You can create a single instance for your entire multi-threaded app as it starts up if you like.
 * - Many services support lazy loading
 */

import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { JivsDomServicesInstaller } from '@plblum/jivs-dom/build/Services/JivsDomServicesInstaller';
import { AriaService } from '@plblum/jivs-dom/build/Aria/AriaService';
import { IJivsDomServices } from '@plblum/jivs-dom/build/Interfaces/JivsDomServices';
import { IPresentationFactory } from '@plblum/jivs-dom/build/Interfaces/Presentations_common';
import { IFieldPresentation } from '@plblum/jivs-dom/build/Interfaces/FieldPresentations';
import { IEditorAdapterDefinitionFactory } from '@plblum/jivs-dom/build/Interfaces/EditorAdapterDefinitions';
import { TextInputPresentation } from '@plblum/jivs-dom/build/FieldPresentations/TextInputPresentation';
import { CheckboxPresentation } from '@plblum/jivs-dom/build/FieldPresentations/CheckboxPresentation';
import { RadioButtonsPresentation } from '@plblum/jivs-dom/build/FieldPresentations/RadioButtonsPresentation';
import { SelectPresentation } from '@plblum/jivs-dom/build/FieldPresentations/SelectPresentation';
import { TextAreaPresentation } from '@plblum/jivs-dom/build/FieldPresentations/TextAreaPresentation';
import { FileInputPresentation } from '@plblum/jivs-dom/build/FieldPresentations/FileInputPresentation';
import { WrappedTextInputPresentation } from '@plblum/jivs-dom/build/FieldPresentations/WrappedTextInputPresentation';
import { WrappedCheckboxPresentation } from '@plblum/jivs-dom/build/FieldPresentations/WrappedCheckboxPresentation';
import { WrappedRadioButtonsPresentation } from '@plblum/jivs-dom/build/FieldPresentations/WrappedRadioButtonsPresentation';
import { WrappedSelectPresentation } from '@plblum/jivs-dom/build/FieldPresentations/WrappedSelectPresentation';
import { WrappedTextAreaPresentation } from '@plblum/jivs-dom/build/FieldPresentations/WrappedTextAreaPresentation';
import { WrappedFileInputPresentation } from '@plblum/jivs-dom/build/FieldPresentations/WrappedFileInputPresentation';
import { LabelPresentation } from '@plblum/jivs-dom/build/FieldPresentations/LabelPresentation';
import { RequiredIndicatorPresentation } from '@plblum/jivs-dom/build/FieldPresentations/RequiredIndicatorPresentation';
import { FieldContainerPresentation } from '@plblum/jivs-dom/build/FieldPresentations/FieldContainerPresentation';
import { ElementRole } from '@plblum/jivs-dom/build/Interfaces/Types';
import { PopupErrorMessageDisplayPresentation, PopupErrorMessageDisplayPresentationOptions } from '@plblum/jivs-dom/build/FieldPresentations/PopupErrorMessageDisplayPresentation';
import { MessageFrame } from '@plblum/jivs-dom/build/Presentations_common/MessageFrame';
import { IconMessageFrame } from '@plblum/jivs-dom/build/Presentations_common/IconMessageFrame';
import { HeaderFooterMessageFrame } from '@plblum/jivs-dom/build/Presentations_common/HeaderFooterMessageFrame';
import { InlineErrorMessageDisplayPresentation, InlineErrorMessageDisplayPresentationOptions } from '@plblum/jivs-dom/build/FieldPresentations/InlineErrorMessageDisplayPresentation';
import { ColumnarErrorIndicatorContent } from '@plblum/jivs-dom/build/FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent';
import { IconMessageFrameOptions } from '@plblum/jivs-dom/build/Presentations_common/IconMessageFrame';
import { HeaderFooterMessageFrameOptions } from '@plblum/jivs-dom/build/Presentations_common/HeaderFooterMessageFrame';
import { InputAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/InputAdapterDefinition';
import { CheckboxAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/CheckboxAdapterDefinition';
import { RadioButtonsAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/RadioButtonsAdapterDefinition';
import { FileInputAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/FileInputAdapterDefinition';
import { TextAreaAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/TextAreaAdapterDefinition';
import { SelectAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/SelectAdapterDefinition';
import { WrappedInputAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/WrappedInputAdapterDefinition';
import { WrappedCheckboxAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/WrappedCheckboxAdapterDefinition';
import { WrappedRadioButtonsAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/WrappedRadioButtonsAdapterDefinition';
import { WrappedFileInputAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/WrappedFileInputAdapterDefinition';
import { WrappedTextAreaAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/WrappedTextAreaAdapterDefinition';
import { WrappedSelectAdapterDefinition } from '@plblum/jivs-dom/build/EditorAdapterDefinitions/WrappedSelectAdapterDefinition';

new JivsDomServicesInstaller();  // install the domServices service property on JivsServices

/**
 * Call from createJivsServices() or wherever you set up your JivsServices instance.
 * The object itself is already attached to the JivsServices instance as the domServices property
 * by the call above to new JivsDomServicesInstaller().
 * @param jivsServices 
 * @returns 
 */
export function configureJivsDom(jivsServices: IJivsServices):void {
    // Implementation for creating and configuring JivsDomServices goes here
    const domServices = jivsServices.domServices;

    // configuration options
    // These provide global defaults for many options available on Presentations.
    let options = domServices.options;  // already exists with no default values.
    const iconInErrorMessages = '&#9888;'; // ⚠ = '&#9888;'
    //   const iconInErrorMessages = '&#x2716;'; // ✖ = '&#x2716;'
    options.iconMessageFrame.iconContent = iconInErrorMessages;
    options.columnarErrorIndicatorContent.column1Html = iconInErrorMessages;
    options.columnarErrorIndicatorContent.column3Html = '&#8250;'; // › = '&#8250;'

    // ARIA Service
    // The service is optional. It is enabled here. Just comment out the following line if you don't want it.
    domServices.ariaService = new AriaService(domServices);

    domServices.fieldPresentationFactory.lazyRegistration(registerFieldPresentations);    

    // Popup Mechanism
    // Supports popup error messages. Set up in order to use PopupErrorMessageDisplayPresentation.
    // The Popup Mechanism is available in a separate library, such as jivs-dom-tippy for Tippy.js integration.
    // domServices.popupMechanism = new TippyPopupMechanism(domServices);


    domServices.editorAdapterDefinitionFactory.lazyRegistration(registerEditorAdapterDefinitions);


}

/**
 * Field Presentations adjust CSS styles based on the validation state of the field.
 * They support editors, labels, Error Message Displays, field containers, and required indicators.
 * Error Message Displays use the field presentation to generate HTML content that 
 * displays the error messages.
 * 
 * The FieldPresentation classes are highly customizable and we expect you to
 * adjust existing registrations or create variations of them.
 * 
 * Field Presentations are each given a unique key when registered with the factory.
 * Use that same key to specify them.
 * For example, here are two variations of the TextInputPresentation (for input type='text'):
 * factory.register('TextInput', (element) => new TextInputPresentation(element)); // our default
 * factory.register('TextInput+Indicator', 
 *    (element) => new TextInputPresentation(element, {
 *        requiredClassEnabled: true,
 *        variationClasses: 'commandingEditor' // CSS class you created
 *      })); // our default
 * 
 * Our factory already has default field presentations registered
 * for input editors, labels, error message displays, field containers, and required indicators,
 * with their default options. It also supports the all editors within a wrapper (a containing tag)
 * where the CSS style is applied to the wrapper element rather than the individual editors.
 * 
 * Finally, the factory retains a default for each role (editor, label, error, container, required)
 * which you can replace.
 * factory.setDefaultPresentationName(ElementRole.label, 'labelAbove');
 * @param domServices 
 */
function registerFieldPresentations(factory: IPresentationFactory<IFieldPresentation>) : void {
    // FYI: this function is lazy loaded.

    // EDITORS
    factory.register('TextInput', (element) => new TextInputPresentation(element));
    factory.setDefaultPresentationName(ElementRole.editor, 'TextInput');
    factory.register('Checkbox', (element) => new CheckboxPresentation(element));
    factory.register('RadioButtons', (element) => new RadioButtonsPresentation(element));
    factory.register('Select', (element) => new SelectPresentation(element));
    factory.register('TextArea', (element) => new TextAreaPresentation(element));
    factory.register('FileInput', (element) => new FileInputPresentation(element));
    factory.register('Wrapped:TextInput', (element) => new WrappedTextInputPresentation(element));
    factory.register('Wrapped:Checkbox', (element) => new WrappedCheckboxPresentation(element));
    factory.register('Wrapped:RadioButtons', (element) => new WrappedRadioButtonsPresentation(element));
    factory.register('Wrapped:Select', (element) => new WrappedSelectPresentation(element));
    factory.register('Wrapped:TextArea', (element) => new WrappedTextAreaPresentation(element));
    factory.register('Wrapped:FileInput', (element) => new WrappedFileInputPresentation(element));

    // LABELS, REQUIRED INDICATORS, AND CONTAINERS
    factory.register('Label', (element) => new LabelPresentation(element));
    factory.setDefaultPresentationName(ElementRole.label, 'Label');
    factory.register('RequiredIndicator', (element) => new RequiredIndicatorPresentation(element));
    factory.setDefaultPresentationName(ElementRole.required, 'RequiredIndicator');
    factory.register('FieldContainer', (element) => new FieldContainerPresentation(element));
    factory.setDefaultPresentationName(ElementRole.container, 'FieldContainer');

    // ERROR MESSAGE DISPLAYS
    /*  Error Message Displays are more complex, as they have several components,
     * each supported by other HTML generating classes, and numerous options.
     * The components are:
     * 1. The tag you add to the page to anchor the error messages.
     *    ErrorMessageDisplayPresentation subclasses customizes that tag
     *    and gathers together the other parts through its constructor.
     *    - InlineErrorMessageDisplayPresentation is where errors are shown inline.
     *    - PopupErrorMessageDisplayPresentation is where errors are shown in a popup.
     * 
     * 2. The Message Frame, which provides the content around the Message Content component.
     *    Here you typically find headers, icons, and other decorative elements.
     *    - MessageFrame is just a single tag wrapped around the Message Content.
     *    - IconMessageFrame places an icon to the side of the Message Content.
     *    - HeaderFooterMessageFrame includes an optional localized header and footer 
     *      around the Message Content.
     * 
     * 3. The Message Content, which contains the actual error message HTML.
     *    IssuesFoundFormatterService generates just the Message Content, either as a single
     *    span for a single issue or a ul containing li elements for multiple issues.
     *
     * 4. Popup only: The Popup Container, which is the outermost tag for the popup variant of the Error Message Display.
     *    It is generated, styled, positioned and managed by a popup library.
     *    It gets its content from the Message Frame and Message Content.
     * 
     * 5. Popup only: Error Indicator Content, which is used as the content for 
     *    PopupErrorMessageDisplayPresentation to create the visual indicator for errors, such as an icon or badge.
     *    - ColumnarErrorIndicatorContent provides one or more columns, that can display icons and text.        
     */

    /* Setup the Message Frame (wraps the Message Content with optional headers, footers, and icons)
        
        MessageFrame: no header, footer, or icon. Just the Message Content.
        <div class="jivs-messageframe">
            <!-- Message Content goes here -->
        </div>

        const messageFrame = new MessageFrame({
            messagesLimit: 0 // limit for the number of messages, 0 means no limit. Can set globally
        });

        HeaderFooterMessageFrame: includes an optional localized header and footer around the Message Content.
        <div class="jivs-headerfootermessageframe">
            <div class="jivs-header">
                <!-- Header Content goes here -->
            </div>
            <div class="jivs-messagecontent">
                <!-- Message Content goes here -->
            </div>
            <div class="jivs-footer">
                <!-- Footer Content goes here -->
            </div>
        </div>

        const messageFrame = new HeaderFooterMessageFrame({
            headerHtml: 'header in HTML', // Can set globally
            footerHtml: 'footer in HTML', // Can set globally
            headerHtmll10n: 'localization key for headerHtml', // setup in ErrorMessagesService. Can set globally
            footerHtmll10n: 'localization key for footerHtml', // setup in ErrorMessagesService. Can set globally
            messagesLimit: 0, // limit for the number of messages, 0 means no limit. Can set globally
            outerClasses: [] // array of additional CSS classes to apply to <div class="jivs-headerfootermessageframe">
        });

        IconMessageFrame: includes an icon alongside the Message Content.
        <div class="jivs-iconmessageframe">
            <div class='jivs-column1'>
                <!-- Icon element goes here - determined by options -->
            </div>
            <div class='jivs-column2'>
                 <!-- Message Content goes here -->
            </div>
        </div>

        new IconMessageFrame({
            iconContent: 'icon in HTML', // set to supply HTML as the content. Can set globally
            imageSrc: 'image source URL', // set include an img tag with this url. Can set globally
            headerHtml: 'header in HTML', // optional. Can set globally
            headerHtmll10n: 'localization key for headerHtml', // setup in ErrorMessagesService. Can set globally
            messagesLimit: 0, // limit for the number of messages, 0 means no limit. Can set globally
            outerClasses: [] // array of additional CSS classes to apply to <div class="jivs-iconmessageframe">
        });

    */
    
    const messageFrame = new MessageFrame({});

    const iconMFOptions: IconMessageFrameOptions = {
        iconContent: '&#9888;',  // The "Warning" symbol: ⚠; Alternative suggestion: ✖ = '&#x2716;'
        // headerHtml: 'Please fix the errors',
        // headerHtmll10n: 'ErrorMessageHeader' // suggested localization key. Set it up with the ErrorMessagesService
    };
    const iconMessageFrame = new IconMessageFrame(iconMFOptions);

    const headerFooterMFOptions: HeaderFooterMessageFrameOptions = {
        headerHtml: 'Please fix the errors',
        // headerHtmll10n: 'ErrorMessageHeader' // suggested localization key. Set it up with the ErrorMessagesService
        // footerHtml: 'Footer content in HTML'
        // footerHtmll10n: 'ErrorMessageFooter' // suggested localization key. Set it up with the ErrorMessagesService
    };
    const headerFooterMessageFrame = new HeaderFooterMessageFrame(headerFooterMFOptions);

    const inlineErrorMessageDisplayPresentationOptions: InlineErrorMessageDisplayPresentationOptions = {
        variationClasses: [], // additional CSS classes for <div class="jivs-inlineerrormessagedisplay">
    };

    factory.register('InlineError',
        (element) => new InlineErrorMessageDisplayPresentation(
            element, messageFrame, inlineErrorMessageDisplayPresentationOptions));
    factory.register('InlineErrorBeside', // provides a gap at the start of the error message display
        (element) => new InlineErrorMessageDisplayPresentation(
            element, messageFrame, {
                variationClasses: ['jivs-position-beside'] 
        }));
    factory.register('InlineErrorBelow', // provides a gap below the error message display
        (element) => new InlineErrorMessageDisplayPresentation(
            element, messageFrame, {
                variationClasses: ['jivs-position-below'] 
        }));
    
    /*
       Popup Error Message Display Presentation Options
       REMINDER: In order to use this, you must establish a popup mechanism through domServices.popupMechanism.
   
       There are two separate elements involved:
       - Trigger element that tells the user about the presence of an error, and can trigger it.
       This is managed by PopupErrorMessageDisplayPresentation.
       - Popup element that displays the error message when triggered.
       This is managed by the popup library, through domServices.popupMechanism.
   
       The trigger uses an ErrorIndicatorContent object to generate content. 
       That is were you see an icon and possibly text like 'errors'.

       The popup element gets its content from a MessageFrame object, 
       just like with InlineErrorMessageDisplayPresentation.

       We supply ColumnarErrorIndicatorContent:
       new ColumnarErrorIndicatorContent({
            column1Html: // content for the first column, in HTML. Can set globally
            column2Html: // content for the second column, in HTML. Can set globally
            column3Html: // content for the third column, in HTML. Can set globally
            column1Htmll10n: // localization key for the first column's HTML content. Can set globally
            column2Htmll10n: // localization key for the second column's HTML content. Can set globally
            column3Htmll10n: // localization key for the third column's HTML content. Can set globally
        });
    */
/* UNCOMMENT when you have added a PopupMechanism    
    const popupContent = new MessageFrame({});
    const errorIndicatorContent = new ColumnarErrorIndicatorContent({});
        
    const popupMechanismOptions = {
        // each PopupMechanism defines options for how the popup should behave, such as positioning, triggers, and animations.
        // This object is where you set it up.
        // You should have an interface defining the shape of this object, such as TippyPopupMechanismOptions.
        // and can strongly type it: const popupOptions: TippyPopupMechanismOptions = { } 
    };

    const popupErrorMessageDisplayPresentationOptions: PopupErrorMessageDisplayPresentationOptions = {
        variationClasses: [], // additional CSS classes for <div class="jivs-popuperrormessagedisplay">
    };
    
    factory.register('PopupError',
        (element) => new PopupErrorMessageDisplayPresentation(
            element, errorIndicatorContent, popupContent, popupMechanismOptions,
            popupErrorMessageDisplayPresentationOptions));
    factory.register('PopupErrorBeside', // provides a gap at the start of the error message display
        (element) => new PopupErrorMessageDisplayPresentation(
            element, errorIndicatorContent, popupContent, popupMechanismOptions,
            {
                variationClasses: ['jivs-position-beside']
            }));
    factory.register('PopupErrorBelow', // provides a gap below the error message display
        (element) => new PopupErrorMessageDisplayPresentation(
            element, errorIndicatorContent, popupContent, popupMechanismOptions,
            {
                variationClasses: ['jivs-position-below']
            }));
*/            
}

/**
 * An Editor Adapter Definition associated your editor components with Jivs-Dom.
 * Many editors are simply the input, select, and textarea HTML elements.
 * They have been registered with default adapter definitions in Jivs-Dom.
 * Also built in: input, select, textarea that are wrapped in a containing element,
 * which helps establish presentations associated with the editor component.
 * 
 * Use this function when you have a new editor component that needs to be associated with Jivs-Dom.
 * Create yours by subclassing EditorAdapterDefinitionBase.
 * 
 * A definition is responsible for:
 *  - recognizing the element as supported by this definition;
 *  - resolving the element that serves as the JivsElement;
 *  - supplying the TextValueAdapter and optional ValueAdapter so that jivs-dom
 *    can read and write the value of the element;
 *  - attaching event handlers that send edited values to the IFieldValueHost;
 *  - identifying the field presentation used to show that the editor is invalid;
 *  - optionally supporting ARIA attributes related to validation state.
 * @param domServices 
 */
function registerEditorAdapterDefinitions(factory: IEditorAdapterDefinitionFactory): void
{
    // FYI: this function is lazy loaded.
    // InputAdapterDefinition provides the Adapter Key in the second parameter.
    factory.register(new InputAdapterDefinition('text', 'input:text', 80));
    factory.register(new InputAdapterDefinition('password', 'input:password', 80));
    factory.register(new InputAdapterDefinition('email', 'input:email', 80));
    factory.register(new InputAdapterDefinition('number', 'input:number', 80));
    factory.register(new InputAdapterDefinition('url', 'input:url', 80));
    factory.register(new InputAdapterDefinition('tel', 'input:tel', 80));
    factory.register(new InputAdapterDefinition('date', 'input:date', 80));
    factory.register(new InputAdapterDefinition('month', 'input:month', 80));
    factory.register(new InputAdapterDefinition('week', 'input:week', 80));
    factory.register(new InputAdapterDefinition('time', 'input:time', 80));
    factory.register(new InputAdapterDefinition('datetime-local', 'input:datetime-local', 80));
    factory.register(new CheckboxAdapterDefinition('input:checkbox', 80));
    factory.register(new RadioButtonsAdapterDefinition('input:radio', 80));
    factory.register(new FileInputAdapterDefinition('input:file', 80));

    factory.register(new TextAreaAdapterDefinition('textarea', 80));
    factory.register(new SelectAdapterDefinition('select', 80));

    // wrapped around the native HTML form controls
    // InputAdapterDefinition provides the Adapter Key in the second parameter.
    // Default wrapped adapter keys look like this: 'wrapped:input:type'
    factory.register(new WrappedInputAdapterDefinition('text', 'wrapped:input:text', 80));
    factory.register(new WrappedInputAdapterDefinition('password', 'wrapped:input:password', 80));
    factory.register(new WrappedInputAdapterDefinition('email', 'wrapped:input:email', 80));
    factory.register(new WrappedInputAdapterDefinition('number', 'wrapped:input:number', 80));
    factory.register(new WrappedInputAdapterDefinition('url', 'wrapped:input:url', 80));
    factory.register(new WrappedInputAdapterDefinition('tel', 'wrapped:input:tel', 80));
    factory.register(new WrappedInputAdapterDefinition('date', 'wrapped:input:date', 80));
    factory.register(new WrappedInputAdapterDefinition('month', 'wrapped:input:month', 80));
    factory.register(new WrappedInputAdapterDefinition('week', 'wrapped:input:week', 80));
    factory.register(new WrappedInputAdapterDefinition('time', 'wrapped:input:time', 80));
    factory.register(new WrappedInputAdapterDefinition('datetime-local', 'wrapped:input:datetime-local', 80));
    factory.register(new WrappedCheckboxAdapterDefinition('wrapped:input:checkbox', 80));
    factory.register(new WrappedRadioButtonsAdapterDefinition('wrapped:input:radio', 80));
    factory.register(new WrappedFileInputAdapterDefinition('wrapped:input:file', 80));
    factory.register(new WrappedTextAreaAdapterDefinition('wrapped:textarea', 80));
    factory.register(new WrappedSelectAdapterDefinition('wrapped:select', 80));

}
