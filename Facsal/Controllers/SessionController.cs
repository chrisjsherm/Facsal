using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Facsal.Controllers
{
    public class SessionController : ApiController
    {
        [HttpGet]
        public HttpResponseMessage Extend()
        {
            return Request.CreateResponse(HttpStatusCode.NoContent, "application/json");
        }

        [AllowAnonymous]
        [HttpGet]
        public HttpResponseMessage Ping()
        {
            return Request.CreateResponse(HttpStatusCode.NoContent, "application/json");
        }
    }
}
