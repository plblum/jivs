## 0.9.7
- Breaking API change. ValueHosts use "name" instead of "id" to provide their identifier, in preparation for supporting paths (hierarchy of ValueHosts).
  IValueHost.getId() -> IValueHost.getName()
  ValueHostDescriptor.id -> ValueHostDescriptor.name