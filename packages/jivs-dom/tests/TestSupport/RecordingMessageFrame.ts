import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IMessageFrame } from '../../src/Interfaces/IMessageFrame';

export interface ISetDomServicesCall
{
    domServices: IJivsDomServices;
}

export interface IMessageFrameApplyCall
{
    containerElement: HTMLElement;
    issuesFound: IssueFound[];
    valueHostsManager: IValueHostsManager;
    fieldValueHost: IFieldValueHost | null;
}

export class RecordingMessageFrame implements IMessageFrame
{
    public setDomServicesCalls: ISetDomServicesCall[] = [];
    public applyCalls: IMessageFrameApplyCall[] = [];

    public constructor(
        private readonly updatesContainer: boolean,
        private readonly contentFactory: (issuesFound: IssueFound[]) => string =
            issuesFound => issuesFound.map(issue => issue.errorMessage).join('|')
    )
    {
    }

    public setDomServices(domServices: IJivsDomServices): void
    {
        this.setDomServicesCalls.push({ domServices: domServices });
    }

    public needsContainerUpdate(): boolean
    {
        return this.updatesContainer;
    }

    public apply(
        containerElement: HTMLElement,
        issuesFound: IssueFound[],
        valueHostsManager: IValueHostsManager,
        fieldValueHost: IFieldValueHost | null
    ): void
    {
        this.applyCalls.push({
            containerElement: containerElement,
            issuesFound: issuesFound,
            valueHostsManager: valueHostsManager,
            fieldValueHost: fieldValueHost
        });
        containerElement.innerHTML = this.contentFactory(issuesFound);
    }
}
