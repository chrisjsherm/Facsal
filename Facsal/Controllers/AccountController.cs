using Facsal.Models;
using SalaryEntities.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Security;

namespace Facsal.Controllers
{
    public class AccountController : ApiController
    {
        IUnitOfWork UnitOfWork;

        public AccountController (IUnitOfWork unitOfWork)
        {
            UnitOfWork = unitOfWork;
        }

        [HttpGet]
        public HttpResponseMessage GetUserInfo()
        {
            var userInfo = new UserInfoViewModel
            {
                UserName = User.Identity.Name,
            };

            userInfo.UserRoles = string.Join(",", Roles.GetRolesForUser());

            return Request.CreateResponse<UserInfoViewModel>(HttpStatusCode.OK, userInfo);
        }
    }
}
