# ValueHosts
Every value that you expose to Jivs is kept in a `ValueHost`. They identify what to validate, and supply values that the user may not be editing, like static or calculated values. There are several types:

- `FieldValueHost` – For any field that may be validated. It actually keeps two values around when working with a UI: 
    - **Native Value** – the value fully compatible with the model's property
    - **Text Value** – the value from within the editor
    > These terms – Native Value and Text Value – will be referenced frequently throughout Jivs documentation.
- `StaticValueHost` – The value that is not validated itself, but its value is needed by validation rules. It can also retain a member of the Model that is not being edited.
- `CalcValueHost` – For calculated values needed by validation rules. Classic example is the difference in days between two dates is compared to a number of days. You supply it a function that returns a value, which can be based on other ValueHosts. 

`ValueHostsManager` holds all `ValueHosts`.

## Topics
- [Naming your ValueHost](./Naming_ValueHosts.md)
- [Configuring ValueHosts](./Configuring_ValueHosts.md)
- [Getting the ValueHosts from the ValueHostsManager](./Getting_a_ValueHost.md)
- [Getting and Setting Values](./Getting_and_Setting_Values.md)
- [Using CalcValueHost](./Using_CalcValueHost.md)
- [Disabling a ValueHost](./Disabling_a_ValueHost.md)
- [Injecting errors on demand](./Injecting_errors_on_demand.md)

## API References
- [ValueHostBase class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_AbstractClasses_ValueHostBase.ValueHostBase.html)
- [FieldValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_FieldValueHost.FieldValueHost.html)
- [StaticValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_StaticValueHost.StaticValueHost.html)
- [CalcValueHost class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHosts_ConcreteClasses_CalcValueHost.CalcValueHost.html)
- [ValueHostsManager class](http://jivs.peterblum.com/TypeDoc/classes/jivs-engine_ValueHostsManager_ConcreteClasses.ValueHostsManager.html)

---
Go to [API Home](../Home.md)