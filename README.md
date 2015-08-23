FacSal
=========
FacSal is salary management application designed to facilitate faculty salary evaluations. It is written in C# and JavaScript on the .NET framework.

## Configuration

FacSal is configured to use Central Authentication Service (CAS) forms authentication. 
To use CAS authentication, you will need to add the configuration elements for ASP.NET 
Forms Authentication discussed in the [CAS documentation](https://wiki.jasig.org/display/casc/.net+cas+client) 
to Web.config or use a transformation to insert them via a Web.Debug.config/Web.Release.config file.

Related to CAS, you will need to modify the application's authorization filtering in the FilterConfig.cs 
and WebApiConfig.cs files within FacSal/App_Start which currently contains roles specific to Virginia Tech.

To deploy the application to Azure, you must add a ServiceConfiguration.Cloud.cscfg file to the Cloud Service project.

## MIT License

Copyright 2014 Virginia Tech under the [MIT License](LICENSE).
