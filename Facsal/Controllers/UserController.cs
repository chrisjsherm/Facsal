using SalaryEntities.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Facsal.Controllers
{
    public class UserController : ApiController
    {
        IUnitOfWork UnitOfWork;

        public UserController(IUnitOfWork unitOfWork)
        {
            UnitOfWork = unitOfWork;
        }

        [HttpGet]
        public IHttpActionResult GetByDepartmentalAccess([FromUri]string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("manage-users-" + id))
            {
                var users = UnitOfWork.UserRepository
                    .Find(u => u.RoleAssignments
                        .Any(ra => ra.Role.Name.EndsWith(id)));

                return Ok(users);
            }

            return Unauthorized();
        }
    }
}
