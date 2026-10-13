import { IErrorMessageDisplayController } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IPopupContext } from '../Interfaces/PopupErrorMessageDisplays';

/**
 * Implementation of the IPopupContext interface without any popup mechanism specific extensions.
 * An IPopupMechanism implementation may need additional properties or methods specific to the popup library it uses.
 * It should subclass PopupContext and return that implementation from its createContext method.
 * 
 * State of its properties
 * - messageFrameContent: null until Presentation.apply() gets it from MessageFrame.
 * - anchorElement: Determined by Presentation prior to open from PopupErrorMessageDisplayPresentationOptions.anchorSelector.
 * - controller: Determined by the Presentation prior to open.
 * - domServices: Determined by the Presentation prior to open.
 */
export class PopupContext implements IPopupContext
{
    public messageFrameContent: HTMLElement | null = null;
    public anchorElement: HTMLElement | null = null;
    public controller: IErrorMessageDisplayController | null = null;
    public domServices: IJivsDomServices | null = null;

    public dispose(): void
    {
        this.messageFrameContent = null;
        this.anchorElement = null;
        this.controller = null;
        this.domServices = null;
    }
}