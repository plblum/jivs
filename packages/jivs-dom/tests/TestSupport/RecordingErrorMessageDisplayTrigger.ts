import type { IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext } from '../../src/Interfaces/ErrorMessageDisplayPresentation';

export class RecordingErrorMessageDisplayTrigger implements IErrorMessageDisplayTrigger
{
    public installCalls: IErrorMessageDisplayTriggerContext[] = [];

    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        this.installCalls.push(context);
    }
}
