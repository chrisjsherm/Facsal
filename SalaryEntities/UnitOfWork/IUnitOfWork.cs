using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;
using SalaryEntities.Entities;
using SalaryEntities.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalaryEntities.UnitOfWork
{
    public interface IUnitOfWork
    {
        IRepository<AppointmentType> AppointmentTypeRepository { get; }
        IRepository<BaseSalaryAdjustment> BaseSalaryAdjustmentRepository { get; }
        IRepository<Department> DepartmentRepository { get; }
        IRepository<Employment> EmploymentRepository { get; }
        IRepository<FacultyType> FacultyTypeRepository { get; }
        IRepository<LeaveType> LeaveTypeRepository { get; }
        IRepository<MeritAdjustmentType> MeritAdjustmentTypeRepository { get; }
        IRepository<Person> PersonRepository { get; }
        IRepository<RankType> RankTypeRepository { get; }
        IRepository<Role> RoleRepository { get; }
        IRepository<RoleAssignment> RoleAssignmentRepository { get; }
        IRepository<Salary> SalaryRepository { get; }
        IRepository<SpecialAdjustmentType> SpecialAdjustmentTypeRepository { get; }
        IRepository<StatusType> StatusTypeRepository { get; }
        IRepository<Unit> UnitRepository { get; }
        IRepository<User> UserRepository { get; }

        int Commit();

        // Breeze specific.
        string Metadata();
        SaveResult Commit(JObject changeSet);
    }
}
