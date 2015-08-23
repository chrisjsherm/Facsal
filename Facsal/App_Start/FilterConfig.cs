using System.Web;
using System.Web.Mvc;

namespace Facsal
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            // Show custom error page.
            filters.Add(new HandleErrorAttribute());

            // Require HTTPS when not running in debug mode.
            if (!HttpContext.Current.IsDebuggingEnabled)
            {
                filters.Add(new RequireHttpsAttribute());
            }

            // Force requests into role authorization pipeline.
            if (!HttpContext.Current.IsDebuggingEnabled)
            {
                filters.Add(new AuthorizeAttribute() { Roles = "VT-EMPLOYEE" });
            }
        }
    }
}