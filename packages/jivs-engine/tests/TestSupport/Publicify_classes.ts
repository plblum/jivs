import { ValueHostsManagerConfig, ValueHostsManagerInstanceState } from "../../src/Interfaces/ValueHostsManager";
import { IValueHost, ValueHostConfig, ValueHostInstanceState } from "../../src/Interfaces/ValueHost";
import { ValueHostsManager } from "../../src/Validation/ValueHostsManager";



export class Publicify_ValueHostsManager<TState extends ValueHostsManagerInstanceState = ValueHostsManagerInstanceState>
    extends ValueHostsManager<TState>
{
    public getValueHostConfig(valueHostName: string): ValueHostConfig | null
    {
        return this.valueHostConfigs.get(valueHostName) ?? null;
    }    
    public get publicify_config(): ValueHostsManagerConfig
    {
        return this.config;
    }
    public get publicify_valueHosts(): Map<string, IValueHost> {
        return this.valueHosts;
    }    
    public get publicify_valueHostConfigs(): Map<string, ValueHostConfig> {
        return this.valueHostConfigs;
    }
    public get publicify_InstanceState(): ValueHostsManagerInstanceState {
        return this.instanceState;
    }
    public publicify_invokeOnConfigChanged(): void
    {
        super.invokeOnConfigChanged();
    }

    override notifyValueHostInstanceStateChanged(valueHost: IValueHost, instanceState: ValueHostInstanceState): void
    {
        super.notifyValueHostInstanceStateChanged(valueHost, instanceState);
        if (this.onNotifyValueHostInstanceStateChanged) {
            this.onNotifyValueHostInstanceStateChanged(valueHost, instanceState);
        }
    }
    /**
     * Callback hook for when a ValueHost's instance state changes.
     */
    public onNotifyValueHostInstanceStateChanged?: (valueHost: IValueHost, instanceState: ValueHostInstanceState) => void;
}