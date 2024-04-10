## 0.9.8
- **Breaking API change.** ValueHosts use "name" instead of "id" to provide their identifier, in preparation for supporting paths (hierarchy of ValueHosts).
  IValueHost.getId() -> IValueHost.getName()
  ValueHostDescriptor.id -> ValueHostDescriptor.name
- IValidatorServices now implements IServices, allowing additional libraries to install their own services using setService()
  and consume them using getService().
  `IValidatorServices.getService<typecast>("name")`
  `IValidatorServices.setService("name", service)`