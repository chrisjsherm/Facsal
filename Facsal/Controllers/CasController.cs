using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Facsal.Controllers
{
    public class CasController : Controller
    {
        [AllowAnonymous]
        public ActionResult Logout()
        {
            DotNetCasClient.CasAuthentication.SingleSignOut();
            return RedirectToAction("Index", "Home");
        }
    }
}