using ChrisJSherm.Filters;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;

namespace Facsal
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            /*
             * Enables query options globally for any controller action 
             * that returns an IQueryable type.
             * http://www.asp.net/web-api/overview/odata-support-in-aspnet-web-api/supporting-odata-query-options
             */
            config.EnableQuerySupport();

            // Default all routes to require authentication.
            if (!HttpContext.Current.IsDebuggingEnabled)
            {
                config.Filters.Add(new System.Web.Http.AuthorizeAttribute() { Roles = "VT-EMPLOYEE" });
            }

            // Validate request against model attributes by default.
            config.Filters.Add(new ValidateModelAttribute());

            // Return JSON payloads with camel casing.
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();

            // Require HTTPS when not running in debug mode.
            if (!HttpContext.Current.IsDebuggingEnabled)
            {
                config.Filters.Add(new RequireHttpsWebApiAttribute());
            }
        }
    }
}