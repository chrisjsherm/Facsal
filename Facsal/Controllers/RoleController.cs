using SalaryEntities.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Security;
using ChrisJSherm.Extensions;
using SalaryEntities.Entities;

namespace Facsal.Controllers
{
    public class RoleController : ApiController
    {
        IUnitOfWork UnitOfWork;

        public RoleController(IUnitOfWork unitOfWork)
        {
            UnitOfWork = unitOfWork;
        }

        [HttpGet]
        public IHttpActionResult GetAssignableRoles()
        {
            var roles = UnitOfWork.RoleAssignmentRepository
                .Find(ra => ra.User.Pid == User.Identity.Name)
                .Select(ra => ra.Role);

            var assignableRoleNames = new HashSet<string>();

            foreach (var role in roles.Where(r => r.Name.StartsWith("manage-users-")))
            {
                var departmentId = role.Name.GetLast(4);
                assignableRoleNames.Add("read-" + departmentId);
                assignableRoleNames.Add("update-" + departmentId);                
            }

            var assignableRoles = UnitOfWork.RoleRepository
                .Find(r => assignableRoleNames.Any(l => l == r.Name));
            
            return Ok(assignableRoles);
        }
    }
}
