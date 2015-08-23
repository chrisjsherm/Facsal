using Facsal.Models.Files;
using FacsalData;
using OfficeOpenXml;
using SalaryEntities.Entities;
using SalaryEntities.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Facsal.Controllers
{
    public class ReportFileController : Controller
    {
        FacsalDbContext DbContext;
        ICollection<string> UserRoles;

        public ReportFileController(FacsalDbContext dbContext)
        {
            DbContext = dbContext;
            UserRoles = Roles.GetRolesForUser().ToList<string>();
        }

        public ActionResult DepartmentFiscalOfficerExport(string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var department = DbContext.Departments
                    .Include("Unit")
                    .Where(d => d.Id == id)
                    .ToList()[0];

                var salaries = DbContext.Salaries
                    .Include("Person")
                    .Include("Person.Employments")
                    .Include("Person.StatusType")
                    .Include("RankType")
                    .Include("AppointmentType")
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == id))
                    .OrderBy(s => s.RankType.SequenceValue)
                        .ThenBy(s => s.Person.LastName)
                    .ToList();

                var package = new ExcelPackage();
                var departments = new List<Department>() { department };
                var report = new FiscalOfficerExport(package, departments, salaries, false);


                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult UnitFiscalOfficerExport(string id)
        {
            var authorizedDepartments = GetAuthorizedDepartments(id);

            if (authorizedDepartments.Count > 0)
            {
                var salaries = DbContext.Salaries
                    .Include("Person")
                    .Include("Person.Employments")
                    .Include("Person.StatusType")
                    .Include("RankType")
                    .Include("AppointmentType")
                    .Where(s => s.Person.Employments.Any(e => e.Department.UnitId == id))
                    .OrderBy(s => s.RankType.SequenceValue)
                    .ThenBy(s => s.Person.LastName)
                    .ToList();

                var package = new ExcelPackage();
                var report = new FiscalOfficerExport(package, authorizedDepartments, salaries, true);

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult DepartmentMeritSummary(string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var department = DbContext.Departments
                    .Include("Unit")
                    .Where(d => d.Id == id)
                    .ToList()[0];

                var salaries = DbContext.Salaries
                    .Include("Person")
                    .Include("Person.Employments")
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == id))
                    .OrderBy(s => s.RankType.SequenceValue)
                        .ThenBy(s => s.Person.LastName)
                    .ToList();

                var package = new ExcelPackage();
                var departments = new List<Department>() { department };
                var report = new MeritSummaryReport(package, departments, salaries, false);

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult UnitMeritSummary(string id)
        {
            var authorizedDepartments = GetAuthorizedDepartments(id);

            if (authorizedDepartments.Count > 0)
            {
                var salaries = DbContext.Salaries
                    .Include("Person")
                    .Include("Person.Employments")
                    .Where(s => s.Person.Employments.Any(e => e.Department.UnitId == id))
                    .OrderBy(s => s.RankType.SequenceValue)
                    .ThenBy(s => s.Person.LastName)
                    .ToList();

                var package = new ExcelPackage();
                var report = new MeritSummaryReport(package, authorizedDepartments, salaries, true);

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult DepartmentSalariesByFacultyType(string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var department = DbContext.Departments
                    .Include("Unit")
                    .Where(d => d.Id == id)
                    .ToList()[0];

                var salaries = DbContext.Salaries
                    .Include("FacultyType")
                    .Where(s => s.Person.Employments.Any(e => e.DepartmentId == id));

                var package = new ExcelPackage();
                var header = "Salaries By Faculty Type: " + department.Unit.Name +
                " " + TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString("MMMM dd, yyyy");
                var departments = new List<Department>() { department };
                var report = new SalariesByFacultyTypeReport(package, departments, salaries, false,
                    header, null, "Salaries by faculty type");

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult UnitSalariesByFacultyType(string id)
        {
            var authorizedDepartments = GetAuthorizedDepartments(id);

            if (authorizedDepartments.Count > 0)
            {
                var salaries = DbContext.Salaries
                    .Include("FacultyType")
                    .Where(s => s.Person.Employments.Any(e => e.Department.UnitId == id));

                var package = new ExcelPackage();
                var header = "Salaries By Faculty Type: " + authorizedDepartments.FirstOrDefault().Unit.Name +
                    " " + TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                        System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString("MMMM dd, yyyy");
                var report = new SalariesByFacultyTypeReport(package, authorizedDepartments, salaries, true,
                    header, null, "Salaries by faculty type");

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult DepartmentMeeting(string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var department = DbContext.Departments
                    .Include("Unit")
                    .Where(d => d.Id == id)
                    .ToList()[0];

                var salaries = GetDepartmentMeetingSalaries(id);

                var package = new ExcelPackage();
                var departments = new List<Department>() { department };
                var fileName = "FacSal_MeetingReport_" +
                TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                + ".xlsx";
                var report = new MeetingReport(package, departments, salaries, 
                    11, false, fileName);

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult UnitMeeting(string id)
        {
            var authorizedDepartments = GetAuthorizedDepartments(id);

            if (authorizedDepartments.Count > 0)
            {
                var salaries = GetUnitMeetingSalaries(id);

                var package = new ExcelPackage();
                var fileName = "FacSal_MeetingReport_" +
                TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                + ".xlsx";
                new MeetingReport(package, authorizedDepartments, salaries, 
                    11, false, fileName);

                var header = "Virginia Tech Meeting Report: " + authorizedDepartments.FirstOrDefault().Unit.Name +
                    " " + TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                        System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString("MMMM dd, yyyy");
                var report = new SalariesByFacultyTypeReport(package, authorizedDepartments, salaries, true,
                    header, fileName, "Unit summary");

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult ExecutiveDepartmentMeeting(string id)
        {
            if (User.IsInRole("manage-all") ||
                User.IsInRole("read-" + id))
            {
                var department = DbContext.Departments
                    .Include("Unit")
                    .Where(d => d.Id == id)
                    .ToList()[0];

                var salaries = GetDepartmentMeetingSalaries(id);

                var package = new ExcelPackage();
                var departments = new List<Department>() { department };
                var fileName = "FacSal_ExecutiveMeetingReport_" +
                TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                + ".xlsx";
                var report = new MeetingReport(package, departments, salaries, 15,
                    true, fileName);

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        public ActionResult ExecutiveUnitMeeting(string id)
        {
            var authorizedDepartments = GetAuthorizedDepartments(id);

            if (authorizedDepartments.Count > 0)
            {
                var salaries = GetUnitMeetingSalaries(id);

                var package = new ExcelPackage();
                var fileName = "FacSal_ExecutiveMeetingReport_" +
                TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                    System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString()
                + ".xlsx";
                new MeetingReport(package, authorizedDepartments, salaries, 15, true,
                    fileName);

                var header = "Virginia Tech Meeting Report: " + authorizedDepartments.FirstOrDefault().Unit.Name +
                    " " + TimeZoneInfo.ConvertTimeBySystemTimeZoneId(
                        System.DateTime.Now, TimeZoneInfo.Local.Id, "Eastern Standard Time").ToString("MMMM dd, yyyy");
                var report = new SalariesByFacultyTypeReport(package, authorizedDepartments, salaries, true, header,
                    fileName, "Unit summary");

                return File(report.Package.GetAsByteArray(), report.FileType, report.FileName);
            }

            return new HttpUnauthorizedResult();
        }

        private IOrderedQueryable<Salary> GetDepartmentMeetingSalaries(string departmentId)
        {
            var salaries = DbContext.Salaries
                .Include("Person")
                .Include("Person.Employments")
                .Include("Person.Employments.Department")
                .Include("RankType")
                .Include("MeritAdjustmentType")
                .Include("SpecialSalaryAdjustments")
                .Include("SpecialSalaryAdjustments.SpecialAdjustmentType")
                .Include("AppointmentType")
                .Include("LeaveType")
                .Where(s => s.Person.Employments.Any(e => e.DepartmentId == departmentId))
                .OrderBy(s => s.RankType.SequenceValue)
                    .ThenBy(s => s.RankType.Name)
                    .ThenBy(s => s.Person.LastName);

            return salaries;
        }

        private IOrderedQueryable<Salary> GetUnitMeetingSalaries(string unitId)
        {
            var salaries = DbContext.Salaries
                .Include("Person")
                .Include("Person.Employments")
                .Include("Person.Employments.Department")
                .Include("RankType")
                .Include("SpecialSalaryAdjustments")
                .Include("SpecialSalaryAdjustments.SpecialAdjustmentType")
                .Include("MeritAdjustmentType")
                .Include("AppointmentType")
                .Include("LeaveType")
                .Where(s => s.Person.Employments.Any(e => e.Department.UnitId == unitId))
                .OrderBy(s => s.RankType.SequenceValue)
                    .ThenBy(s => s.RankType.Name)
                    .ThenBy(s => s.Person.LastName);

            return salaries;
        }

        private List<Department> GetAuthorizedDepartments(string unitId)
        {
            var departments = DbContext.Departments
                .Include("Unit")
                .Where(d => d.UnitId == unitId)
                .OrderBy(d => d.Name)
                .ToList();

            var authorizedDepartments = new List<Department>();

            foreach (var department in departments)
            {
                if (User.IsInRole("manage-all") ||
                    User.IsInRole("read-" + department.Id))
                {
                    authorizedDepartments.Add(department);
                }
            }

            return authorizedDepartments;
        }
    }
}