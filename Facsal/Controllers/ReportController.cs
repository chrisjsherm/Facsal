using FacsalData;
using SalaryEntities.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Facsal.Controllers
{
    public class ReportController : ApiController
    {
        FacsalDbContext DbContext;
        int CycleYear;

        public ReportController(FacsalDbContext dbContext)
        {
            DbContext = dbContext;
            int.TryParse(ConfigurationManager.AppSettings["CycleYear"], out CycleYear);
        }

        [HttpGet]
        public IHttpActionResult GetSalariesByFacultyType([FromUri]string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var salaries = DbContext.Salaries
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == id))
                    .GroupBy(s => s.FacultyTypeId)
                    .Select(sg => new
                    {
                        FacultyType = sg.Select(x => x.FacultyType.Name),
                        StartingSalaries = sg.Sum(x => x.BaseAmount + x.AdminAmount +
                            x.EminentAmount + x.PromotionAmount),
                        MeritIncreases = sg.Sum(x => x.MeritIncrease),
                        SpecialIncreases = sg.Sum(x => x.SpecialIncrease),
                        EminentIncreases = sg.Sum(x => x.EminentIncrease),
                        NewSalaries = sg.Sum(x => x.BaseAmount + x.AdminAmount +
                            x.EminentAmount + x.PromotionAmount + x.MeritIncrease +
                            x.SpecialIncrease + x.EminentIncrease)
                    });

                return Ok(salaries);
            }

            return Unauthorized();
        }

        [HttpGet]
        public IHttpActionResult GetPersonsWithMultipleEmployments([FromUri] string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var data = DbContext.Persons
                    .Include("Salaries")
                    .Where(p => p.Employments.Count > 1 &&
                        p.Employments.Any(e => e.DepartmentId == id)
                    )
                    .Select(pg => new
                    {
                        FullName = pg.FirstName + " " + pg.LastName,
                        SalaryId = pg.Salaries.Where(s => s.CycleYear == CycleYear)
                            .FirstOrDefault().Id
                    });

                return Ok(data);
            }

            return Unauthorized();
        }
    }
}
